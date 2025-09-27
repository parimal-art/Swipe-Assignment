const API_BASE = '/api'

export async function generateQuestion(difficulty) {
  const response = await fetch(`${API_BASE}/generate-question`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      roleContext: 'Full Stack (React/Node)',
      difficulty,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate question')
  }

  return response.json()
}

export async function scoreAnswer({ question, answer, difficulty }) {
  const response = await fetch(`${API_BASE}/score-answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      answer,
      difficulty,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to score answer')
  }

  return response.json()
}

export async function generateSummary({ candidateTranscript }) {
  const response = await fetch(`${API_BASE}/generate-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      candidateTranscript,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate summary')
  }

  return response.json()
}