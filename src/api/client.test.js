import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { ApiError, createApiClient } from "./client.js";

describe("API client", () => {
  it("adds signed MAX initData to requests when available", async () => {
    const client = createApiClient({
      baseURL: "https://api.example.test",
      getInitData: () => "signed-init-data",
    });
    let authorization;
    client.defaults.adapter = async (config) => {
      authorization = config.headers.get("Authorization");
      return {
        data: { status: "ok" },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };

    await expect(client.get("/health")).resolves.toEqual({ status: "ok" });
    expect(authorization).toBe("tma signed-init-data");
  });

  it("does not send authorization when opened outside MAX", async () => {
    const client = createApiClient({
      baseURL: "https://api.example.test",
      getInitData: () => null,
    });
    let authorization;
    client.defaults.adapter = async (config) => {
      authorization = config.headers.get("Authorization");
      return {
        data: [],
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };

    await client.get("/api/events");
    expect(authorization).toBeUndefined();
  });

  it("normalizes API failures without hiding status or server error code", async () => {
    const client = createApiClient({
      baseURL: "https://api.example.test",
      getInitData: () => null,
    });
    client.defaults.adapter = async (config) => {
      throw new AxiosError(
        "Request failed",
        "ERR_BAD_REQUEST",
        config,
        {},
        {
          data: { error: "Нужен вход", code: "MAX_AUTH_REQUIRED" },
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config,
        },
      );
    };

    await expect(client.get("/api/private")).rejects.toMatchObject({
      name: "ApiError",
      message: "Нужен вход",
      status: 401,
      code: "MAX_AUTH_REQUIRED",
    });
  });

  it("rejects requests when the API URL is not configured", async () => {
    const client = createApiClient({ getInitData: () => null });
    client.defaults.adapter = async () => {
      throw new Error(
        "The request should have been rejected before reaching the adapter",
      );
    };

    await expect(client.get("/health")).rejects.toBeInstanceOf(ApiError);
    await expect(client.get("/health")).rejects.toMatchObject({
      message: "Не настроен адрес API. Укажите VITE_API_URL.",
    });
  });
});
