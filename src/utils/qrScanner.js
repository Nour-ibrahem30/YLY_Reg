import { Html5Qrcode } from 'html5-qrcode';

export class QRScanner {
  constructor(elementId) {
    this.elementId = elementId;
    this.scanner = null;
    this.isScanning = false;
  }

  async start(onScanSuccess, onScanError) {
    try {
      this.scanner = new Html5Qrcode(this.elementId);
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await this.scanner.start(
        { facingMode: 'environment' },
        config,
        onScanSuccess,
        onScanError
      );

      this.isScanning = true;
      return { success: true };
    } catch (error) {
      console.error('Error starting scanner:', error);
      return { success: false, error: error.message };
    }
  }

  async stop() {
    try {
      if (this.scanner && this.isScanning) {
        await this.scanner.stop();
        this.scanner.clear();
        this.isScanning = false;
      }
      return { success: true };
    } catch (error) {
      console.error('Error stopping scanner:', error);
      return { success: false, error: error.message };
    }
  }

  getState() {
    return {
      isScanning: this.isScanning,
      scanner: this.scanner
    };
  }
}

// Extract userId from QR code data
export const extractUserIdFromQR = (qrData) => {
  try {
    // If QR contains URL like: /profile/governorate/userId
    if (qrData.includes('/profile/')) {
      const parts = qrData.split('/');
      const userId = parts[parts.length - 1];
      const governorate = parts[parts.length - 2];
      return { userId, governorate, success: true };
    }
    
    // If QR contains JSON
    if (qrData.startsWith('{')) {
      const data = JSON.parse(qrData);
      return { ...data, success: true };
    }

    // If QR contains just userId
    return { userId: qrData, success: true };
  } catch (error) {
    console.error('Error extracting userId:', error);
    return { success: false, error: 'Invalid QR Code format' };
  }
};
