import { privateKeyToAccount } from "viem/accounts";

const key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const method = process.argv[2] ?? "POST";
const pathname = process.argv[3] ?? "/api/studies";
const account = privateKeyToAccount(key);
const timestamp = Math.floor(Date.now() / 1000);
const message = `AguasPuras admin\n${method.toUpperCase()} ${pathname}\n${timestamp}`;
const signature = await account.signMessage({ message });
process.stdout.write(`AguasPuras ${account.address} ${timestamp} ${signature}`);
