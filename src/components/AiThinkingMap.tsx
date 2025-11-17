import './AiThinkingMap.css';

export function AiThinkingMap() {
  return (
    <div className="ai-thinking-overlay">
      <div className="western-map">
        <div className="map-paper">
          {/* Compass rose in center */}
          <div className="compass-rose">
            <div className="compass-needle"></div>
            <div className="compass-points">
              <span className="compass-n">N</span>
              <span className="compass-e">E</span>
              <span className="compass-s">S</span>
              <span className="compass-w">W</span>
            </div>
          </div>
          
          {/* Scanning line */}
          <div className="scan-line"></div>
          
          {/* Grid overlay */}
          <div className="map-grid">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={`h-${i}`} className="grid-line grid-line-h" style={{ top: `${i * 10}%` }} />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={`v-${i}`} className="grid-line grid-line-v" style={{ left: `${i * 10}%` }} />
            ))}
          </div>
          
          {/* Decorative elements */}
          <div className="map-corner map-corner-tl"></div>
          <div className="map-corner map-corner-tr"></div>
          <div className="map-corner map-corner-bl"></div>
          <div className="map-corner map-corner-br"></div>
          
          {/* Pulsing target markers */}
          <div className="target-marker target-marker-1"></div>
          <div className="target-marker target-marker-2"></div>
          <div className="target-marker target-marker-3"></div>
        </div>
        
        <div className="map-label">
          <span className="map-label-text">Outlaw Calculating...</span>
          <div className="map-label-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
