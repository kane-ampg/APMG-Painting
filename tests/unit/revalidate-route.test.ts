import { afterEach, describe, expect, it, vi } from 'vitest';

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
vi.mock('next/cache', () => ({ revalidateTag, revalidatePath }));

function request(body: unknown, auth?: string) {
  return new Request('http://localhost/api/revalidate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(auth ? { authorization: auth } : {}) },
    body: JSON.stringify(body),
  });
}

describe('POST /api/revalidate', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('rejects a missing or wrong secret and touches nothing', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 's3cret');
    const { POST } = await import('@/app/api/revalidate/route');
    expect((await POST(request({ tags: ['content:posts'], paths: [] }))).status).toBe(401);
    expect(
      (await POST(request({ tags: ['content:posts'], paths: [] }, 'Bearer nope'))).status,
    ).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('refuses to run when no secret is configured', async () => {
    vi.stubEnv('REVALIDATE_SECRET', '');
    const { POST } = await import('@/app/api/revalidate/route');
    expect((await POST(request({ tags: [], paths: [] }, 'Bearer anything'))).status).toBe(503);
  });

  it('revalidates only content tags and site-relative paths', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 's3cret');
    const { POST } = await import('@/app/api/revalidate/route');
    const res = await POST(
      request(
        { tags: ['content:posts', 'evil'], paths: ['/blog/', 'https://x.example/', '/../etc'] },
        'Bearer s3cret',
      ),
    );
    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledTimes(1);
    expect(revalidateTag).toHaveBeenCalledWith('content:posts', 'max');
    expect(revalidatePath).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith('/blog/');
  });
});
