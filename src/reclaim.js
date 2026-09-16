require("dotenv").config();

const { ReclaimProofRequest } = require("@reclaimprotocol/js-sdk");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function createReclaimProofRequest() {
  const appId = requireEnv("APP_ID");
  const appSecret = requireEnv("APP_SECRET");
  const providerId = requireEnv("PROVIDER_ID");

  return ReclaimProofRequest.init(appId, appSecret, providerId);
}

/**
 * Starts a zkTLS proof session, waits for the user verification callback,
 * and returns the cryptographic proof object (extracted kWh params + signatures).
 */
async function triggerZkTlsProofRequest() {
  const reclaimProofRequest = await createReclaimProofRequest();
  const requestUrl = await reclaimProofRequest.getRequestUrl();
  const statusUrl = reclaimProofRequest.getStatusUrl();

  const proof = await new Promise((resolve, reject) => {
    reclaimProofRequest
      .startSession({
        onSuccess: (proofs) => {
          if (!proofs || proofs === "") {
            reject(new Error("Verification session returned no proof"));
            return;
          }

          const proofObject = Array.isArray(proofs) ? proofs[0] : proofs;
          if (!proofObject) {
            reject(new Error("Verification session returned an empty proof list"));
            return;
          }

          resolve(proofObject);
        },
        onError: (error) => {
          reject(error instanceof Error ? error : new Error(String(error)));
        },
      })
      .catch(reject);
  });

  return {
    proof,
    requestUrl,
    statusUrl,
  };
}

module.exports = {
  createReclaimProofRequest,
  triggerZkTlsProofRequest,
};
