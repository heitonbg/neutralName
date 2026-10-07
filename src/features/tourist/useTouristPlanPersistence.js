import { useEffect, useRef } from "react";
import { mergeSavedRoute } from "./planModel.js";

export function useTouristPlanPersistence({
  plan,
  planDirty,
  isCurrentPlan,
  offlinePinned,
  isGuestMode,
  store,
  setPlan,
  setPlanDirty,
  setSaveStatus,
  setError,
}) {
  const revisionRef = useRef(0);
  const savingRef = useRef(false);
  const saveTimerRef = useRef(null);

  const markPlanDirty = () => {
    revisionRef.current += 1;
    setPlanDirty(true);
    setSaveStatus("dirty");
  };

  useEffect(() => {
    if (
      !plan ||
      !planDirty ||
      !isCurrentPlan ||
      !plan.options?.some((option) => option.events.length)
    ) {
      return undefined;
    }

    const revision = revisionRef.current;
    const snapshot = plan;
    const localCopy = store.tourist.saveLocalPlan({
      ...snapshot,
      storage: "device",
      offlinePinned,
    });
    if (!localCopy) {
      setSaveStatus("device");
      setError(
        "Не удалось сохранить маршрут на устройстве. Проверьте свободное место.",
      );
    } else {
      setSaveStatus("dirty");
    }
    if (isGuestMode) {
      setPlanDirty(false);
      if (localCopy) setSaveStatus("device");
      return undefined;
    }

    const save = async () => {
      if (savingRef.current) {
        saveTimerRef.current = window.setTimeout(save, 300);
        return;
      }
      savingRef.current = true;
      setSaveStatus(localCopy ? "saving" : "device");
      if (localCopy) setError("");
      try {
        const response = await store.tourist.savePlan(snapshot);
        if (revisionRef.current === revision) {
          const synced = {
            ...mergeSavedRoute(snapshot, response.plan),
            storage: "server",
            offlinePinned,
          };
          const serverLostCustomStops = snapshot.options.some(
            (option, index) =>
              (option.customStops || []).length > 0 &&
              !(
                response.plan.options?.find((saved) => saved.id === option.id)
                  ?.customStops ||
                response.plan.options?.[index]?.customStops ||
                []
              ).length,
          );
          if (serverLostCustomStops) {
            synced.storage = "device";
            synced.savedAt = new Date(
              Math.max(Date.now(), Date.parse(response.plan.savedAt) || 0) +
                1000,
            ).toISOString();
          }
          store.tourist.saveLocalPlan(synced);
          setPlan(synced);
          setPlanDirty(false);
          setSaveStatus(serverLostCustomStops ? "device" : "synced");
          if (serverLostCustomStops) {
            setError(
              "Сервер сохранил маршрут без ручных остановок. Обновите backend Amvera; остановки пока оставлены на устройстве.",
            );
          }
        }
      } catch (requestError) {
        if (revisionRef.current === revision) {
          setPlanDirty(false);
          setSaveStatus("device");
          setError(
            `Маршрут сохранён локально, но не синхронизирован: ${requestError.message}`,
          );
        }
      } finally {
        savingRef.current = false;
      }
    };

    saveTimerRef.current = window.setTimeout(save, 650);
    return () => window.clearTimeout(saveTimerRef.current);
  }, [
    plan,
    planDirty,
    isCurrentPlan,
    store,
    offlinePinned,
    isGuestMode,
    setError,
    setPlan,
    setPlanDirty,
    setSaveStatus,
  ]);

  return { markPlanDirty };
}
