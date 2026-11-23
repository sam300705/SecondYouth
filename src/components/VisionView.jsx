import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, CameraOff, CircleAlert, Eye, ScanLine, Volume2 } from 'lucide-react';

const examples = {
  medicine: { title: 'Medicine label example', text: 'Example result: Atorvastatin. Check the printed name, dose, and expiry date before taking it.', tone: 'safe' },
  bill: { title: 'Bill example', text: 'Example result: Electricity bill. Amount and due date would appear here after OCR processing.', tone: 'info' },
  cleaner: { title: 'Hazard example', text: 'Example warning: Household cleaner. Do not ingest. Keep away from children.', tone: 'danger' },
};

export default function VisionView({ onBack, notify }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const requestId = useRef(0);
  const scanTimer = useRef(null);
  const [cameraState, setCameraState] = useState('idle');
  const [scenario, setScenario] = useState('medicine');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  const stopCamera = () => {
    requestId.current += 1;
    window.clearTimeout(scanTimer.current);
    setScanning(false);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraState('idle');
  };

  useEffect(() => () => {
    requestId.current += 1;
    window.clearTimeout(scanTimer.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setCameraState('unsupported'); return; }
    const id = ++requestId.current;
    setCameraState('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      if (requestId.current !== id) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      if (requestId.current === id) setCameraState('active');
    } catch {
      if (requestId.current === id) {
        stopCamera();
        setCameraState('denied');
      }
    }
  };

  const scanDemo = () => {
    if (cameraState !== 'active') { notify('Start the camera before scanning.', 'error'); return; }
    setScanning(true); setResult(null);
    scanTimer.current = window.setTimeout(() => { setScanning(false); setResult(examples[scenario]); }, 1400);
  };

  const speak = () => {
    if (!result || !('speechSynthesis' in window)) { notify('Read-aloud is not supported in this browser.', 'error'); return; }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(result.text));
  };

  return <div className="page-stack vision-page"><header className="page-header"><button type="button" className="icon-button" onClick={() => { stopCamera(); onBack(); }} aria-label="Back to home"><ArrowLeft /></button><div><p className="eyebrow">Camera tool</p><h1>Safety scanner</h1></div><span /></header><div className="demo-banner"><CircleAlert /><p><strong>Interactive demonstration:</strong> the camera is real, but object recognition results are sample scenarios. Medical identification requires a validated AI service and human confirmation.</p></div><section className={`camera-stage state-${cameraState}`}><video ref={videoRef} muted playsInline aria-label="Live camera preview" /><div className="camera-placeholder">{cameraState === 'denied' ? <><CameraOff /><strong>Camera permission denied</strong><span>Allow camera access in your browser settings and try again.</span></> : cameraState === 'unsupported' ? <><CameraOff /><strong>Camera unavailable</strong><span>This browser does not support camera access.</span></> : cameraState !== 'active' ? <><Camera /><strong>{cameraState === 'loading' ? 'Starting camera…' : 'Point the camera at an object'}</strong><span>Nothing is uploaded from this device.</span></> : null}</div>{scanning && <div className="scan-overlay"><i /><ScanLine /><strong>Analyzing demo scenario…</strong></div>}</section><div className="scanner-controls"><label className="field"><span>Demonstration scenario</span><select value={scenario} onChange={(event) => { setScenario(event.target.value); setResult(null); }}><option value="medicine">Medicine label</option><option value="bill">Household bill</option><option value="cleaner">Hazardous cleaner</option></select></label><div className="button-row">{cameraState === 'active' ? <button type="button" className="secondary-button" onClick={stopCamera}><CameraOff /> Stop camera</button> : <button type="button" className="secondary-button" onClick={startCamera} disabled={cameraState === 'loading'}><Camera /> Start camera</button>}<button type="button" className="primary-button" onClick={scanDemo} disabled={scanning}><Eye /> {scanning ? 'Scanning…' : 'Run demo scan'}</button></div></div>{result && <section className={`scan-result result-${result.tone}`} aria-live="polite"><div><h2>{result.title}</h2><p>{result.text}</p></div><button type="button" className="icon-button" onClick={speak} aria-label="Read result aloud"><Volume2 /></button></section>}</div>;
}

