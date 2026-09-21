interface CompassProps {
  playerRotation: number;
  playerPos: [number, number];
  spawnPos: [number, number];
  questPos: [number, number];
}

export default function Compass({ playerRotation, playerPos, spawnPos, questPos }: CompassProps) {
  const getMarkerOffset = (target: [number, number]) => {
    const dx = target[0] - playerPos[0];
    const dz = target[1] - playerPos[1];
    let angle = Math.atan2(dx, -dz) - playerRotation;
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    const maxOffset = 180;
    return Math.max(-maxOffset, Math.min(maxOffset, (angle / (Math.PI / 2)) * 90));
  };

  const spawnOffset = getMarkerOffset(spawnPos);
  const questOffset = getMarkerOffset(questPos);

  const getPointOffset = (baseAngle: number) => {
    let diff = baseAngle - playerRotation;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return (diff / (Math.PI / 2)) * 90;
  };

  const cardinalPoints = [
    { label: 'С', angle: 0 },
    { label: 'В', angle: Math.PI / 2 },
    { label: 'Ю', angle: Math.PI },
    { label: 'З', angle: -Math.PI / 2 },
  ];

  return (
    <div style={{
      position: 'absolute',
      top: '14px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '420px',
      maxWidth: '75vw',
      height: '34px',
      background: 'rgba(15, 6, 8, 0.75)',
      border: '1px solid rgba(239, 68, 68, 0.4)',
      borderRadius: '0px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 20
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: '2px',
        backgroundColor: '#ef4444',
        zIndex: 5
      }} />

      {cardinalPoints.map((point) => {
        const offset = getPointOffset(point.angle);
        if (Math.abs(offset) > 180) return null;
        return (
          <span
            key={point.label}
            style={{
              position: 'absolute',
              transform: `translateX(${offset}px)`,
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              fontFamily: 'sans-serif',
              opacity: 1 - Math.abs(offset) / 190
            }}
          >
            {point.label}
          </span>
        );
      })}

      <div style={{
        position: 'absolute',
        transform: `translateX(${spawnOffset}px) rotate(45deg)`,
        width: '8px',
        height: '8px',
        backgroundColor: '#94a3b8',
        border: '1px solid #cbd5e1',
        zIndex: 4,
        opacity: Math.abs(spawnOffset) >= 180 ? 0.3 : 1
      }} />

      <div style={{
        position: 'absolute',
        transform: `translateX(${questOffset}px) rotate(45deg)`,
        width: '8px',
        height: '8px',
        backgroundColor: '#f97316',
        border: '1px solid #fdba74',
        boxShadow: '0 0 6px #f97316',
        zIndex: 4,
        opacity: Math.abs(questOffset) >= 180 ? 0.3 : 1
      }} />
    </div>
  );
}
