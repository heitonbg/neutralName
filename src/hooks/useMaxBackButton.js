import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function useMaxBackButton() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const button = window.WebApp?.BackButton;
    if (!button?.onClick) return undefined;

    const canGoBack = location.key !== 'default' && !location.state?.startedFromMax;
    if (canGoBack) button.show?.();
    else button.hide?.();

    const handleBack = () => {
      if (location.key !== 'default' && !location.state?.startedFromMax) navigate(-1);
    };
    button.onClick(handleBack);
    return () => button.offClick?.(handleBack);
  }, [location.key, location.state, navigate]);
}
