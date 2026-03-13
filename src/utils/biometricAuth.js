// Biometric Authentication using Web Authentication API (WebAuthn)

// Check if biometric authentication is available
export const isBiometricAvailable = () => {
  return window.PublicKeyCredential !== undefined && 
         navigator.credentials !== undefined;
};

// Register biometric credential for admin
export const registerBiometric = async (userId, userName) => {
  if (!isBiometricAvailable()) {
    throw new Error('المصادقة البيومترية غير مدعومة في هذا المتصفح');
  }

  try {
    // Generate challenge (in production, this should come from server)
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    // Create credential options
    const publicKeyCredentialCreationOptions = {
      challenge: challenge,
      rp: {
        name: "YLY Admin",
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: userName,
        displayName: userName,
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },  // ES256
        { alg: -257, type: "public-key" } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform", // Use platform authenticator (Face ID, Touch ID)
        userVerification: "required",
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: "none"
    };

    // Create credential
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    });

    if (!credential) {
      throw new Error('فشل إنشاء بيانات الاعتماد');
    }

    // Store credential info in localStorage
    const credentialData = {
      id: credential.id,
      rawId: arrayBufferToBase64(credential.rawId),
      type: credential.type,
      userId: userId,
      userName: userName,
      registeredAt: new Date().toISOString()
    };

    localStorage.setItem('admin_biometric_credential', JSON.stringify(credentialData));
    
    return {
      success: true,
      message: 'تم تسجيل المصادقة البيومترية بنجاح'
    };

  } catch (error) {
    console.error('Biometric registration error:', error);
    
    if (error.name === 'NotAllowedError') {
      throw new Error('تم إلغاء عملية التسجيل');
    } else if (error.name === 'NotSupportedError') {
      throw new Error('المصادقة البيومترية غير مدعومة على هذا الجهاز');
    } else {
      throw new Error('حدث خطأ أثناء تسجيل المصادقة البيومترية');
    }
  }
};

// Authenticate using biometric
export const authenticateBiometric = async () => {
  if (!isBiometricAvailable()) {
    throw new Error('المصادقة البيومترية غير مدعومة في هذا المتصفح');
  }

  // Check if credential exists
  const storedCredential = localStorage.getItem('admin_biometric_credential');
  if (!storedCredential) {
    throw new Error('لم يتم تسجيل المصادقة البيومترية من قبل');
  }

  const credentialData = JSON.parse(storedCredential);

  try {
    // Generate challenge
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    // Create authentication options
    const publicKeyCredentialRequestOptions = {
      challenge: challenge,
      allowCredentials: [{
        id: base64ToArrayBuffer(credentialData.rawId),
        type: 'public-key',
        transports: ['internal']
      }],
      userVerification: "required",
      timeout: 60000,
    };

    // Get credential
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    });

    if (!assertion) {
      throw new Error('فشلت المصادقة');
    }

    // Store authentication session
    const authSession = {
      userId: credentialData.userId,
      userName: credentialData.userName,
      authenticatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    sessionStorage.setItem('admin_biometric_session', JSON.stringify(authSession));

    return {
      success: true,
      userId: credentialData.userId,
      userName: credentialData.userName
    };

  } catch (error) {
    console.error('Biometric authentication error:', error);
    
    if (error.name === 'NotAllowedError') {
      throw new Error('تم إلغاء عملية المصادقة');
    } else if (error.name === 'InvalidStateError') {
      throw new Error('بيانات الاعتماد غير صالحة');
    } else {
      throw new Error('فشلت المصادقة البيومترية');
    }
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const session = sessionStorage.getItem('admin_biometric_session');
  if (!session) return false;

  try {
    const authSession = JSON.parse(session);
    const expiresAt = new Date(authSession.expiresAt);
    const now = new Date();

    return now < expiresAt;
  } catch (error) {
    return false;
  }
};

// Get current session
export const getCurrentSession = () => {
  const session = sessionStorage.getItem('admin_biometric_session');
  if (!session) return null;

  try {
    return JSON.parse(session);
  } catch (error) {
    return null;
  }
};

// Logout
export const logout = () => {
  sessionStorage.removeItem('admin_biometric_session');
};

// Remove biometric credential
export const removeBiometric = () => {
  localStorage.removeItem('admin_biometric_credential');
  sessionStorage.removeItem('admin_biometric_session');
};

// Check if biometric is registered
export const isBiometricRegistered = () => {
  return localStorage.getItem('admin_biometric_credential') !== null;
};

// Helper functions
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
