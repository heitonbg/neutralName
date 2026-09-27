import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchFootRoute } from './roadRoute.js';

test('foot router returns road geometry and preserves waypoint order', async () => {
  let requestedUrl = '';
  const result = await fetchFootRoute([
    { lat: 55.75, lng: 49.1 },
    { lat: 55.8, lng: 49.2 },
  ], {
    fetchImpl: async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        json: async () => ({
          code: 'Ok',
          routes: [{
            geometry: { coordinates: [[49.1, 55.75], [49.15, 55.77], [49.2, 55.8]] },
            distance: 4200,
            duration: 3000,
          }],
        }),
      };
    },
  });

  assert.match(requestedUrl, /routed-foot\/route\/v1\/driving\/49\.1,55\.75;49\.2,55\.8/);
  assert.deepEqual(result.coordinates, [[55.75, 49.1], [55.77, 49.15], [55.8, 49.2]]);
  assert.equal(result.distanceMeters, 4200);
  assert.equal(result.durationSeconds, 3000);
});

test('foot router rejects when a road route cannot connect all stops', async () => {
  await assert.rejects(
    fetchFootRoute([{ lat: 55, lng: 49 }, { lat: 56, lng: 50 }], {
      fetchImpl: async () => ({ ok: true, json: async () => ({ code: 'NoRoute', routes: [] }) }),
    }),
    /Не удалось построить пеший маршрут/
  );
});