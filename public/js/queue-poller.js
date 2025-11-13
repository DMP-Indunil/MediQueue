// Polling-based queue updates (replaces Socket.io for Vercel)
class QueuePoller {
  constructor(clinicId, callback, interval = 5000) {
    this.clinicId = clinicId;
    this.callback = callback;
    this.interval = interval;
    this.pollerId = null;
    this.isActive = false;
  }

  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.poll(); // Initial poll
    
    this.pollerId = setInterval(() => {
      this.poll();
    }, this.interval);
  }

  async poll() {
    try {
      const response = await fetch(`/api/queues/${this.clinicId}/current`);
      if (response.ok) {
        const data = await response.json();
        this.callback(data);
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }

  stop() {
    if (this.pollerId) {
      clearInterval(this.pollerId);
      this.pollerId = null;
      this.isActive = false;
    }
  }

  updateInterval(newInterval) {
    this.interval = newInterval;
    if (this.isActive) {
      this.stop();
      this.start();
    }
  }
}

// Export for use in HTML pages
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QueuePoller;
}
