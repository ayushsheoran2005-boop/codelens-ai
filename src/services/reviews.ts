export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type ReviewStatus = 'Complete' | 'No issues' | 'Failed'

export interface Finding {
  id: string
  severity: Severity
  title: string
  line: number
  explanation: string
  suggestion: string
  suggestedCode?: string | null
  file?: string
}

export interface Review {
  id: string
  name: string
  language: string
  code: string
  issues: Finding[]
  status: ReviewStatus
  source?: 'code' | 'github'
  createdAt: string
}

export const SAMPLE_CODE = `import sqlite3

def get_user(user_id):
    connection = sqlite3.connect("app.db")
    cursor = connection.cursor()

    # Find the requested account
    query = "SELECT * FROM users WHERE id = " + user_id
    cursor.execute(query)
    user = cursor.fetchone()

    if user:
        return {
            "id": user[0],
            "email": user[1],
            "password": user[2]
        }

    return None
`

export const SAMPLE_FIX = `import sqlite3

def get_user(user_id):
    connection = sqlite3.connect("app.db")
    cursor = connection.cursor()

    # Bind user input as a query parameter
    cursor.execute(
        "SELECT id, email FROM users WHERE id = ?",
        (user_id,)
    )
    user = cursor.fetchone()

    if user:
        return {"id": user[0], "email": user[1]}

    return None
`
