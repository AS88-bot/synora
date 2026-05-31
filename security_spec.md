# Synora Security Specifications

This specification sheet defines the Attribute-Based Access Control (ABAC), Zero-Trust security invariants, threat vectors, and audit assertions governing the **Synora** cloud-native wellness data engine.

---

## 1. Zero-Trust Security Invariants

Our system architecture enforces the following security assertions at the database level:

1. **Relational Sync Integrity**: No sub-resource (Journal, MoodLog, ChatSession, ChatMessage) can be initialized, queried, or updated except by its authenticated parent owner. Access is bound via the Firebase Auth UUID tokens.
2. **Strict Schema Constraints**: Documents created on the client SDK must exactly match the schema defined in `/firebase-blueprint.json`. Any extra payload field (like `isSynoraAdmin: true` or `role: 'admin'`) injected via client-side manipulation will trigger an immediate schema violation and be blocked.
3. **Immutability Clauses**: The fields binding ownership and timeline history—such as `userId`, `id`, and `createdAt`—are declared absolute constants on update. This mathematically prevents data-hijacking or chronological tampering.
4. **Time Signature Sanity**: Timestamps are bound strictly to `request.time` (the physical Google Firestore server time). Client-declared times are rejected to secure analytical timeline structures.
5. **PII and Data Isolation**: Access to user profile information, full-text emotional logs, and conversation threads is strictly restricted to individual owners (`request.auth.uid == userId`). General or blanket wildcards (`isSignedIn()`) are strictly blocked for user collection queries.

---

## 2. Threat Vector Payload Grid (The "Dirty Dozen")

These twelve theoretical JSON payloads represent advanced adversarial actions targeted to bypass standard middleware security. Our Firestore rules are designed to fail-closed against each variant:

| Victim Path | Attacker Action | Malicious Payload Sample | Desired Result | Attack Vector Category | Rule Enforcer Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/users/alice` | Spoof profile of another user | `{"displayName": "Alice", "role": "admin"}` | `403 FORBIDDEN` | Identity Privilege Escalation | User profile modifications bound by `request.auth.uid == userId` and block roles. |
| `/users/bob` | Ingress payload with ghost fields | `{"displayName": "Bob", "isAdmin": true}` | `403 FORBIDDEN` | Schema & Ghost Field Injection | `data.keys().hasAll()` and exact key size tracking under `create`, `affectedKeys().hasOnly()` on `update`. |
| `/users/alice/...` | Temporal chronological manipulation | `{"createdAt": "2020-01-01T00:00:00Z"}` | `403 FORBIDDEN` | Chronological Poisoning | `incoming().createdAt == request.time` prevents retroactive streak or historical forging. |
| `/users/alice/...` | Field hijacking of historical logs | `{"userId": "attacker_id"}` | `403 FORBIDDEN` | Identity Spoofing / Hijacking | Guarding updates of `userId` field to match existing ownership schemas. |
| `/users/alice/moodLogs/log1` | Slider value bounds extension | `{"moodValue": 99999, "energyValue": -10}` | `403 FORBIDDEN` | Value Range Poisoning | Checked types and boundaries: `incoming().moodValue >= 1 && incoming().moodValue <= 5`. |
| `/users/alice/...` | Buffer overflow / resource drain | `{"notes": "A" * 10^6}` | `403 FORBIDDEN` | Denial of Wallet (Resource Blowup) | Strict string length rules: `incoming().notes.size() <= 1000`. |
| `/users/alice/journals/logA` | System sentiment spoofing | `{"sentimentScore": +1.0, "dominantEmotion": "Joy"}` | `403 FORBIDDEN` | System State Tampering | Marking `sentimentScore` and analytical tips as immutable or authorized variables only. |
| `/users/alice/journals/junkID` | Document key malicious injection | Doc ID = `junk!@#$$%^^&*` | `403 FORBIDDEN` | Document Key Format Exploits | IDs must conform to alphanumeric constraints via regex helper: `isValidId(docId)`. |
| `/users/alice/chatSessions` | Spoof foreign occupant channels | `{"userId": "bob_uid"}` | `403 FORBIDDEN` | Relational Sync Violation | Requires authenticated owner correlation inside the document properties. |
| `/users/alice/chatSessions/sess1/messages/msg1` | Forged dialogue streams | `{"sender": "ai", "text": "Spoofed prompt"}` | `403 FORBIDDEN` | Chat Origin Hijack | AI replies are restricted. System-only rules protect chat dialogue from falsification. |
| `/users/*` | Sweep read request for public collection profiles | `db.collection('users').get()` | `403 FORBIDDEN` | Query Scraping & PII Harvesting | Collection reads must evaluate `resource.data.uid == request.auth.uid` explicitly. |
| `/users/alice/journals/*` | Subcollection batch harvesting | `db.collectionGroup('journals').get()` | `403 FORBIDDEN` | Batch Extraction Attacks | Split matching models prevent sweeping group queries without relational owners. |

---

## 3. Threat Verification Test Suite

This TypeScript testing layout represents our continuous-integration testing target (equivalent to `@firebase/rules-unit-testing`) used during building:

```typescript
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "ai-agent-project-490612",
    firestore: {
      rules: require("fs").readFileSync("firestore.rules", "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("Synora Zero-Trust Penetration Testing Suite", () => {
  it("TC-01: Reject profile creation under another user's UID", async () => {
    const maliciousAlice = testEnv.authenticatedContext("attacker_auth_id").firestore();
    const targetRef = doc(maliciousAlice, "users/alice_uid");
    await expect(
      setDoc(targetRef, {
        uid: "alice_uid",
        email: "alice@gmail.com",
        displayName: "Alice",
        createdAt: new Date(),
        role: "user"
      })
    ).rejects.toThrow();
  });

  it("TC-02: Protect administrative privilege fields from self-escalation", async () => {
    const userContext = testEnv.authenticatedContext("alice_uid").firestore();
    const profileRef = doc(userContext, "users/alice_uid");
    await expect(
      setDoc(profileRef, {
        uid: "alice_uid",
        email: "alice@gmail.com",
        displayName: "Alice",
        createdAt: new Date(),
        role: "admin" // Bypassing role
      })
    ).rejects.toThrow();
  });

  it("TC-03: Reject journal insertions with spoofed AI analysis tags", async () => {
    const userContext = testEnv.authenticatedContext("alice_uid").firestore();
    const journalRef = doc(userContext, "users/alice_uid/journals/entry1");
    await expect(
      setDoc(journalRef, {
        id: "entry1",
        userId: "bob_uid", // Tampering UID
        content: "Feeling great!",
        createdAt: new Date(),
        sentimentScore: 1.0,
        sentimentLabel: "positive",
        dominantEmotion: "Joy"
      })
    ).rejects.toThrow();
  });
});
```
