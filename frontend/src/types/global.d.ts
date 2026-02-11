/** Midtrans Snap.js global type augmentation */
interface MidtransSnapCallbacks {
  onSuccess?: () => void;
  onPending?: () => void;
  onError?: () => void;
  onClose?: () => void;
}

interface MidtransSnap {
  pay: (token: string, options: MidtransSnapCallbacks) => void;
}

interface Window {
  snap?: MidtransSnap;
}
