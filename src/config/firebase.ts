import * as admin from 'firebase-admin';
import serviceAccount from '../../sona-client-firebase-adminsdk-fbsvc-e59af42c32.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL: 'https://sona-client.firebaseio.com',
});

export const adminAuth = admin.auth();