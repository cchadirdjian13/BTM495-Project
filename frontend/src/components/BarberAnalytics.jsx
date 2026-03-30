import React from 'react';

function BarberAnalytics({ appointments }) {
  // 1. Revenue & Completion Stats
  const completed = appointments.filter(a => a.status === 'Completed')
  const cancelled = appointments.filter(a => a.status === 'Cancelled')
  
  const totalRevenue = completed.reduce((sum, a) => sum + (a.service?.price || 0), 0)
  
  const totalBookings = appointments.length
  const cancelRate = totalBookings > 0 ? ((cancelled.length / totalBookings) * 100).toFixed(1) : 0

  // 2. Client Retention (Uniques)
  const uniqueClients = new Set(completed.map(a => a.client.user_id)).size

  // 3. Monthly Breakdowns for Bar Chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyData = {}
  
  // Initialize current and previous 5 months
  const currentMonthIdx = new Date().getMonth()
  for (let i = 5; i >= 0; i--) {
    let idx = currentMonthIdx - i
    if (idx < 0) idx += 12
    monthlyData[months[idx]] = 0
  }

  completed.forEach(a => {
    const d = new Date(a.datetime)
    const mStr = months[d.getMonth()]
    if (monthlyData[mStr] !== undefined) {
      monthlyData[mStr] += 1
    }
  })

  const maxMonthly = Math.max(...Object.values(monthlyData), 1) // prevent div by zero

  // 4. Top Services
  const serviceCounts = {}
  completed.forEach(a => {
    const sName = a.service?.name || 'Unknown'
    serviceCounts[sName] = (serviceCounts[sName] || 0) + 1
  })
  
  const sortedServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* Top Value Metrics */}
      <div className="stats-row" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value gold-text">${totalRevenue.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unique Clients</div>
          <div className="stat-value">{uniqueClients}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cancellation Rate</div>
          <div className="stat-value" style={{ color: cancelRate > 20 ? 'var(--error)' : 'var(--text)' }}>
            {cancelRate}%
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Monthly Clients Bar Chart */}
        <div className="card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Clients Over Time</h2>
          <div className="bar-chart-container">
            {Object.entries(monthlyData).map(([m, val]) => {
              const heightPercent = `${(val / maxMonthly) * 100}%`
              return (
                <div key={m} className="chart-bar-wrap">
                  <div className="chart-value">{val}</div>
                  <div className="chart-bar" style={{ height: heightPercent, minHeight: val > 0 ? '10px' : '2px' }}></div>
                  <div className="chart-label">{m}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Services */}
        <div className="card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Top Performed Services</h2>
          {sortedServices.length === 0 ? (
            <p className="muted">Not enough data to determine top services.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
              {sortedServices.map(([name, count]) => {
                const perc = (count / completed.length) * 100
                return (
                  <div key={name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 500 }}>{name}</span>
                      <span className="gold-text">{count} jobs</span>
                    </div>
                    <div className="progress-wrap">
                      <div className="progress-fill" style={{ width: `${perc}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

export default BarberAnalytics
