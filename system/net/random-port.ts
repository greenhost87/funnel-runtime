import { createServer } from "node:net";

export async function getRandomPort(host = "127.0.0.1"): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.once("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        if (!address || typeof address === "string") {
          reject(new Error("Failed to resolve ephemeral port"));
          return;
        }

        resolve(address.port);
      });
    });
  });
}
