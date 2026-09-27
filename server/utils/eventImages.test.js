import assert from 'node:assert/strict';
import test from 'node:test';
import { collectUnusedEventUploadFilenames } from './eventImages.js';

const image = '/uploads/123e4567-e89b-12d3-a456-426614174000.jpg';
const secondImage = 'https://api.example.com/uploads/123e4567-e89b-12d3-a456-426614174001.webp';

test('collects owned uploads from both image fields and ignores remote images', () => {
  const files = collectUnusedEventUploadFilenames({
    id: 1,
    image,
    images: [image, secondImage, 'https://images.example.com/photo.jpg'],
  }, [{ id: 1, image }]);

  assert.deepEqual(files, [image.split('/').at(-1), secondImage.split('/').at(-1)]);
});

test('keeps an upload that is still referenced by another event', () => {
  const files = collectUnusedEventUploadFilenames({ id: 1, image }, [
    { id: 1, image },
    { id: 2, images: [image] },
  ]);

  assert.deepEqual(files, []);
});

test('ignores upload paths without the server-generated UUID filename', () => {
  const files = collectUnusedEventUploadFilenames({
    id: 1,
    images: ['/uploads/../../events.sqlite', '/uploads/user-photo.jpg'],
  }, []);

  assert.deepEqual(files, []);
});