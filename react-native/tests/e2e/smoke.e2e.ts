import { by, device, element, expect, waitFor } from 'detox';

describe('Boilerplate app smoke flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('placeholder e2e test', async () => {
    await waitFor(element(by.id('home-screen-root'))).toBeVisible().withTimeout(30000);
    await expect(element(by.id('home-screen-title'))).toBeVisible();
  });
});
