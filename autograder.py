import json
from google import genai
from google.genai import types


def grade_sql_with_ai(user_answer: str) -> dict:

    GEMINI_API_KEY = 

    if not GEMINI_API_KEY:
        return {
            "passed": False,
            "score": 0,
            "status": "Grader Error",
            "feedback": "GEMINI_API_KEY environment variable is not set. "
                        "Please set it before running: set GEMINI_API_KEY=AIzaSy... (Windows) "
                        "or export GEMINI_API_KEY=AIzaSy... (Mac/Linux)"
        }

    client = genai.Client(api_key=GEMINI_API_KEY)

    prompt = f"""
    You are an automated technical interview autograder for a SQL platform.
    Your job is to grade a user's SQL submission for the following problem:

    Problem: Find the second highest salary from the `Employee` table.
    If there is no second highest salary, return NULL.

    Expected Table Schema:
    - Table Name: Employee
    - Column: salary

    User's Submitted SQL Query:
    \"\"\"{user_answer}\"\"\"

    Grading Rubric Criteria:
    1. SYNTAX & STRUCTURE: Does the query have valid SQL syntax? Does it actually include the correct table name ('Employee') and column ('salary')? If it is missing the FROM clause or table name, the score MUST be 0.
    2. LOGIC (LIMIT/OFFSET): Does it correctly isolate the second record?
    3. EDGE CASES (DISTINCT): Does it include DISTINCT to handle duplicate highest values? If missing, cap the maximum score at 2.

    You must output your response in raw JSON format matching this schema exactly:
    {{
        "passed": true/false,
        "score": integer (0 to 5),
        "status": "Accepted" or "Wrong Answer" or "Partial Credit" or "Syntax Error",
        "feedback": "Detailed, specific feedback explaining why they lost points or why it passed."
    }}
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.5-pro',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.0
            ),
        )

        return json.loads(response.text)

    except json.JSONDecodeError as e:
        return {
            "passed": False,
            "score": 0,
            "status": "Grader Error",
            "feedback": f"Failed to parse AI response as JSON: {str(e)}"
        }
    except Exception as e:
        return {
            "passed": False,
            "score": 0,
            "status": "Grader Error",
            "feedback": f"The AI grading engine encountered an error: {str(e)}"
        }


def print_result(scenario: str, sql: str, result: dict):
    """Pretty-prints a grading result."""
    print(f"\n{'=' * 60}")
    print(f"  {scenario}")
    print(f"{'=' * 60}")
    print(f"  SQL: {sql}")
    print(f"  Result:\n{json.dumps(result, indent=4)}")


if __name__ == "__main__":
    print("\n--- DEMONSTRATING AI-POWERED SQL AUTOGRADER ---")

    # Scenario 1: Missing FROM clause and table name entirely
    user_sql = input("Write MySql query for finding the second highest salary from the "
                     "Employee table. If there is no second highest salary, return NULL : ")
    print_result(
        "Grade Received",
        user_sql,
        grade_sql_with_ai(user_sql)
    )


