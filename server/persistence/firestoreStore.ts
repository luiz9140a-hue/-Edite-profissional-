import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import type { GenerationJob, Project } from '../../src/types/engrenagem.ts';

let firestore: Firestore | null | undefined;

function getFirestoreStore(): Firestore | null {
  if (firestore !== undefined) return firestore;

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!serviceAccountJson && !(projectId && clientEmail && privateKey)) {
      firestore = null;
      return firestore;
    }

    const app = getApps()[0] || initializeApp({
      credential: serviceAccountJson
        ? cert(JSON.parse(serviceAccountJson))
        : cert({ projectId, clientEmail, privateKey })
    });
    firestore = getFirestore(app);
  } catch (error) {
    console.warn('[Firestore] Persistência indisponível; usando memória local nesta instância.', error);
    firestore = null;
  }

  return firestore;
}

export function isFirestoreConfigured(): boolean {
  return Boolean(getFirestoreStore());
}

export async function saveJob(job: GenerationJob): Promise<void> {
  const db = getFirestoreStore();
  if (!db) return;
  await db.collection('generation_jobs').doc(job.id).set(job, { merge: true });
}

export async function saveProject(project: Project): Promise<void> {
  const db = getFirestoreStore();
  if (!db) return;
  await db.collection('projects').doc(project.id).set(project, { merge: true });
}

export async function getJob(jobId: string): Promise<GenerationJob | null> {
  const db = getFirestoreStore();
  if (!db) return null;
  const snapshot = await db.collection('generation_jobs').doc(jobId).get();
  return snapshot.exists ? snapshot.data() as GenerationJob : null;
}

export async function getProject(projectId: string): Promise<Project | null> {
  const db = getFirestoreStore();
  if (!db) return null;
  const snapshot = await db.collection('projects').doc(projectId).get();
  return snapshot.exists ? snapshot.data() as Project : null;
}
