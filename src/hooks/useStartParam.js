import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { maxBridge } from '../utils/maxBridge.js';

export function useStartParam() {
  const navigate = useNavigate();

  useEffect(() => {
    const param = maxBridge.getStartParam();
    if (param === 'my') {
      navigate('/my', { replace: true, state: { startedFromMax: true } });
      return;
    }

    const eventMatch = String(param || '').match(/^event_(\d+)$/);
    if (eventMatch) {
      navigate(`/events/${eventMatch[1]}`, {
        replace: true,
        state: { startedFromMax: true },
      });
    }
  }, [navigate]);
}
