import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:5001/api';

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 DÉBUT DES TESTS FONCTIONNELS ET DE SÉCURITÉ - SYLLA COLLAB');
  console.log('🧪 ========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? `-> ${detail}` : ''}`);
      failed++;
    }
  }

  // 1. Health check & PostgreSQL DB
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    assert(res.status === 200 && data.status === 'ok', '1. API Health & Connexion PostgreSQL', JSON.stringify(data));
  } catch (err: any) {
    assert(false, '1. API Health & Connexion PostgreSQL', err.message);
  }

  // 2. Sécurité : Accès refusé aux routes admin sans token
  try {
    const res = await fetch(`${API_BASE}/admin/collaborations`);
    assert(res.status === 401, '2. Sécurité : Dashboard Admin protégé sans authentification (401 attendu)');
  } catch (err: any) {
    assert(false, '2. Sécurité Admin', err.message);
  }

  // 3. Authentification Admin avec mauvais mot de passe
  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@sylla.com', password: 'mauvais_mdp' }),
    });
    assert(res.status === 401, '3. Sécurité : Rejet des identifiants admin invalides (401 attendu)');
  } catch (err: any) {
    assert(false, '3. Rejet mauvais mdp', err.message);
  }

  // 4. Authentification Admin réussie
  let adminToken = '';
  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@sylla.com', password: 'admin_sylla_2026' }),
    });
    const data = await res.json();
    adminToken = data.token;
    assert(res.status === 200 && !!adminToken, '4. Authentification Admin réussie avec génération JWT');
  } catch (err: any) {
    assert(false, '4. Connexion Admin valide', err.message);
  }

  // 5. Soumission d'une demande écrite (Partenariat)
  let trackingCode1 = '';
  try {
    const formData = new FormData();
    formData.append('category', 'PARTENARIAT');
    formData.append('fullName', 'Amadou Ba');
    formData.append('phone', '+221 77 123 45 67');
    formData.append('company', 'Dakar Tech Solutions');
    formData.append('description', 'Proposition de partenariat stratégique pour l’écosystème Sylla avec notre application mobile.');

    const res = await fetch(`${API_BASE}/collaborations`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    trackingCode1 = data.data?.trackingCode;
    assert(
      res.status === 201 && data.success && trackingCode1.startsWith('SYL-'),
      '5. Soumission demande écrite et génération code de suivi (ex: ' + trackingCode1 + ')'
    );
  } catch (err: any) {
    assert(false, '5. Soumission demande écrite', err.message);
  }

  // 6. Soumission d'une demande avec message vocal
  let trackingCodeVoice = '';
  let audioFilename = '';
  try {
    // Création d'un buffer audio factice simulant un enregistrement audio webm
    const dummyAudioBuffer = Buffer.from('RIFF....WAVEfmt ....data....');
    const audioBlob = new Blob([dummyAudioBuffer], { type: 'audio/webm' });

    const formData = new FormData();
    formData.append('category', 'PUBLICITE');
    formData.append('fullName', 'Fatou Diallo');
    formData.append('phone', '+221 78 987 65 43');
    formData.append('company', 'Mode & Élégance');
    formData.append('audioDuration', '45');
    formData.append('audio', audioBlob, 'test_voice.webm');

    const res = await fetch(`${API_BASE}/collaborations`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    trackingCodeVoice = data.data?.trackingCode;
    assert(
      res.status === 201 && data.success && !!trackingCodeVoice,
      '6. Soumission demande vocale avec upload de fichier audio (ex: ' + trackingCodeVoice + ')'
    );
  } catch (err: any) {
    assert(false, '6. Soumission vocale', err.message);
  }

  // 7. Suivi public par code unique
  try {
    const res = await fetch(`${API_BASE}/collaborations/track/${trackingCode1}`);
    const data = await res.json();
    assert(
      res.status === 200 && data.data?.trackingCode === trackingCode1 && data.data?.status === 'NOUVELLE',
      '7. Consultation publique par code de suivi sans compte utilisateur'
    );
    assert(
      data.data?.maskedName.includes('***'),
      '7b. Confidentialité publique : Masquage partiel du nom du demandeur'
    );
  } catch (err: any) {
    assert(false, '7. Suivi public', err.message);
  }

  // 8. Sécurité : Aucune fuite de notes internes sur l'API publique
  try {
    const res = await fetch(`${API_BASE}/collaborations/track/${trackingCode1}`);
    const data = await res.json();
    assert(
      data.data.internalNotes === undefined,
      '8. Sécurité stricte : Les notes internes ne sont JAMAIS exposées au public'
    );
  } catch (err: any) {
    assert(false, '8. Vérification fuite de données', err.message);
  }

  // 9. Dashboard Admin : Consultation de la liste et vérification du tri
  let testCollabId = '';
  try {
    const res = await fetch(`${API_BASE}/admin/collaborations`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    const list = data.data;
    testCollabId = list[0]?.id;
    audioFilename = list.find((c: any) => c.trackingCode === trackingCodeVoice)?.audioPath || '';

    // Vérifier tri chronologique décroissant
    const isSortedDesc = list.every((item: any, i: number) => {
      if (i === 0) return true;
      return new Date(list[i - 1].createdAt).getTime() >= new Date(item.createdAt).getTime();
    });

    assert(
      res.status === 200 && list.length >= 2 && isSortedDesc,
      '9. Dashboard Admin : Liste chronologique décroissante et compteurs en temps réel'
    );
  } catch (err: any) {
    assert(false, '9. Liste admin', err.message);
  }

  // 10. Dashboard Admin : Détail du dossier et génération du lien standard wa.me
  try {
    const res = await fetch(`${API_BASE}/admin/collaborations/${testCollabId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    const waLink = data.data?.whatsappLink;
    assert(
      res.status === 200 && waLink && waLink.startsWith('https://wa.me/'),
      '10. Dashboard Admin : Lien standard wa.me généré pour contact direct sans WhatsApp Business API'
    );
  } catch (err: any) {
    assert(false, '10. Détail dossier admin', err.message);
  }

  // 11. Dashboard Admin : Ajout d'une note interne confidentielle
  try {
    const res = await fetch(`${API_BASE}/admin/collaborations/${testCollabId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ content: 'Note confidentielle : Budget prévisionnel validé par la direction.' }),
    });
    const data = await res.json();
    assert(
      res.status === 201 && data.success && data.data?.content.includes('Budget'),
      '11. Ajout et persistance d’une note interne confidentielle dans PostgreSQL'
    );
  } catch (err: any) {
    assert(false, '11. Ajout note interne', err.message);
  }

  // 12. Workflow Statut : Mettre en étude
  try {
    const res = await fetch(`${API_BASE}/admin/collaborations/${testCollabId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'EN_ETUDE', publicComment: 'Dossier transmis au comité de direction.' }),
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.data?.status === 'EN_ETUDE',
      '12. Transition de statut -> EN_ETUDE avec commentaire public daté'
    );
  } catch (err: any) {
    assert(false, '12. Changement statut EN_ETUDE', err.message);
  }

  // 13. Workflow Statut : Accepter le dossier
  try {
    const res = await fetch(`${API_BASE}/admin/collaborations/${testCollabId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'ACCEPTEE' }),
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.data?.status === 'ACCEPTEE',
      '13. Transition de statut -> ACCEPTEE'
    );
  } catch (err: any) {
    assert(false, '13. Statut ACCEPTEE', err.message);
  }

  // 14. Workflow Statut : Archiver puis Restaurer
  try {
    // Archiver
    const resArch = await fetch(`${API_BASE}/admin/collaborations/${testCollabId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'ARCHIVEE' }),
    });
    const dataArch = await resArch.json();

    // Restaurer
    const resRest = await fetch(`${API_BASE}/admin/collaborations/${testCollabId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ action: 'RESTAURER' }),
    });
    const dataRest = await resRest.json();

    assert(
      dataArch.data?.status === 'ARCHIVEE' && dataRest.data?.status === 'ACCEPTEE',
      '14. Cycle complet : Archivage puis Restauration vers l’état précédent dans PostgreSQL'
    );
  } catch (err: any) {
    assert(false, '14. Cycle Archivage / Restauration', err.message);
  }

  // 15. Sécurité : Protection Path Traversal sur la route audio
  try {
    const res = await fetch(`${API_BASE}/audio/..%2F..%2Fpackage.json`);
    assert(
      res.status === 404,
      '15. Sécurité : Rejet des attaques Path Traversal sur le streaming audio'
    );
  } catch (err: any) {
    assert(false, '15. Path traversal test', err.message);
  }

  // 16. Streaming audio avec Range HTTP header
  if (audioFilename) {
    try {
      const res = await fetch(`${API_BASE}/audio/${audioFilename}`, {
        headers: { Range: 'bytes=0-10' },
      });
      assert(
        res.status === 206 && res.headers.get('content-range') !== null,
        '16. Streaming audio HTTP 206 (Partial Content) pour lecture fluide dans le navigateur'
      );
    } catch (err: any) {
      assert(false, '16. Streaming audio Range', err.message);
    }
  }

  // 17. Suppression définitive d’un dossier (avec protection et persistance)
  try {
    // 17a: Rejet sans token admin (401)
    const unauthDelete = await fetch(`${API_BASE}/admin/collaborations/${testCollabId}`, {
      method: 'DELETE',
    });
    assert(
      unauthDelete.status === 401,
      '17a. Sécurité : Suppression refusée sans authentification admin (401)'
    );

    // 17b: Suppression autorisée avec token admin
    const authDelete = await fetch(`${API_BASE}/admin/collaborations/${testCollabId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deleteData = await authDelete.json();
    assert(
      authDelete.status === 200 && deleteData.success,
      '17b. Suppression définitive réussie par l’administrateur'
    );

    // 17c: Vérification que le dossier a bien disparu de la base
    const checkDeleted = await fetch(`${API_BASE}/admin/collaborations/${testCollabId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      checkDeleted.status === 404,
      '17c. Vérification : Dossier introuvable après suppression (404 confirmé)'
    );
  } catch (err: any) {
    assert(false, '17. Suppression dossier', err.message);
  }

  console.log('\n========================================================');
  console.log(`📊 RÉSULTATS : ${passed} TESTS RÉUSSIS / ${failed} ÉCHECS`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Erreur critique du testeur :', e);
  process.exit(1);
});
