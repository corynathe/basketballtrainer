import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Button, Row, Col, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBasketballBall,
  faMapMarkerAlt,
  faFlagCheckered,
  faBullseye
} from '@fortawesome/free-solid-svg-icons';

const spots = ['Left Corner', 'Left Wing', 'Top of Key', 'Right Wing', 'Right Corner'];
const startTypes = ['Stationary', 'Dribbling'];
const actions = [
  'Finish at the Hoop Left',
  'Finish at the Hoop Right',
  'Finish Pull-Up Left',
  'Finish Pull-Up Right',
  'Shoot',
  'Stepback Left',
  'Stepback Right'
];

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentSpot, setCurrentSpot] = useState('');
  const [currentStartType, setCurrentStartType] = useState('');
  const [currentAction, setCurrentAction] = useState('');
  const [stats, setStats] = useState({ total: 0, makes: 0, actions: {} });
  const [showButtons, setShowButtons] = useState(false);
  const [timer, setTimer] = useState(0);
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const countdownRef = useRef(null);

  const handleManualStat = useCallback((made) => {
    recognitionRef.current?.stop();
    clearTimeout(timeoutRef.current);
    clearInterval(countdownRef.current);
    setTimer(0);
    updateStats(currentAction, made);
    setShowButtons(false);
    setTimeout(() => {
      if (isRunning) {
        startRound();
      }
    }, 1000);
  }, [isRunning, currentAction]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) return;
    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      if (transcript.includes('make')) {
        handleManualStat(true);
      } else if (transcript.includes('miss')) {
        handleManualStat(false);
      }
    };

    recognitionRef.current = recognition;
  }, [handleManualStat]);

  const resetStats = () => {
    setStats({ total: 0, makes: 0, actions: {} });
  };

  const startRound = useCallback(() => {
    const spot = pickRandom(spots);
    const start = pickRandom(startTypes);
    const action = pickRandom(actions);

    setCurrentSpot(spot);
    setCurrentStartType(start);
    setCurrentAction(action);

    speak(spot, () => {
      setTimeout(() => {
        speak(start, () => {
          setTimeout(() => {
            speak(action, () => {
              setShowButtons(true);
              setTimer(10);
              recognitionRef.current?.start();

              countdownRef.current = setInterval(() => {
                setTimer((prev) => {
                  if (prev <= 1) {
                    clearInterval(countdownRef.current);
                    return 0;
                  }
                  return prev - 1;
                });
              }, 1000);

              timeoutRef.current = setTimeout(() => {
                handleManualStat(false);
              }, 10000);
            });
          }, 2500);
        });
      }, 3000);
    });
  }, [handleManualStat]);

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const speak = (text, onEnd) => {
    const utterance = new SpeechSynthesisUtterance(text);
    if (onEnd) {
      utterance.onend = onEnd;
    }
    speechSynthesis.speak(utterance);
  };

  const updateStats = (action, made) => {
    setStats((prev) => {
      const actionStats = prev.actions[action] || { makes: 0, total: 0 };
      return {
        total: prev.total + 1,
        makes: prev.makes + (made ? 1 : 0),
        actions: {
          ...prev.actions,
          [action]: {
            makes: actionStats.makes + (made ? 1 : 0),
            total: actionStats.total + 1,
          }
        }
      };
    });
  };

  const handleStart = () => {
    setIsRunning(true);
    startRound();
  };

  const handlePause = () => {
    setIsRunning(false);
    recognitionRef.current?.stop();
    clearTimeout(timeoutRef.current);
    clearInterval(countdownRef.current);
    setTimer(0);
  };

  const formatStatsLine = (action, data) =>
    `${action}: ${data.makes} / ${data.total}`;

  return (
    <Container className="text-center py-4">
      <h1 className="mb-4" style={{ color: 'black' }}>
        <FontAwesomeIcon icon={faBasketballBall} style={{ color: '#d65a31' }} className="me-2" />
        Operation Buckets Jr.
        <FontAwesomeIcon icon={faBasketballBall} style={{ color: '#d65a31' }} className="ms-2" />
      </h1>

      <div className="mb-3 d-flex justify-content-center gap-3">
        {!isRunning ? (
          <Button variant="success" size="lg" onClick={handleStart}>Start</Button>
        ) : (
          <Button variant="warning" size="lg" onClick={handlePause}>Pause</Button>
        )}
        <Button variant="light" size="lg" onClick={resetStats}>Reset Stats</Button>
      </div>

      <Card className="my-4 p-4">
        <Card.Body>
          <h2 style={{ fontSize: '1.8rem' }}>
            <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-primary" />
            <strong>{currentSpot}</strong><br />
            <FontAwesomeIcon icon={faFlagCheckered} className="me-2 text-success" />
            <strong>{currentStartType}</strong><br />
            <FontAwesomeIcon icon={faBullseye} className="me-2 text-danger" />
            <strong>{currentAction}</strong>
          </h2>
        </Card.Body>
      </Card>

      <div style={{ minHeight: '120px' }} className="d-flex flex-column align-items-center justify-content-center">
        {!isRunning && (
          <div className="text-danger my-2" style={{ fontSize: '1.3rem' }}>🎤 Waiting for your action...</div>
        )}
        {showButtons && (
          <>
            <div className="d-flex justify-content-center gap-3 mt-2">
              <Button variant="outline-success" size="lg" onClick={() => handleManualStat(true)}>Make</Button>
              <Button variant="outline-danger" size="lg" onClick={() => handleManualStat(false)}>Miss</Button>
            </div>
            <div className="mt-2" style={{ fontSize: '1.3rem' }}>
              Listening... <strong>{timer}</strong> seconds left
            </div>
          </>
        )}
      </div>

      <div className="mt-4">
        <h4 style={{ fontSize: '1.5rem' }}>
          Made Shots: {stats.makes} / {stats.total}
        </h4>
        <ul className="list-unstyled mt-3" style={{ fontSize: '1.2rem' }}>
          {Object.entries(stats.actions).map(([action, data]) => (
            <li key={action}>{formatStatsLine(action, data)}</li>
          ))}
        </ul>
      </div>
    </Container>
  );
}

export default App;
