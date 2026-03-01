const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, session, performanceSummary, questions } = await req.json();

    let prompt = '';
    let systemPrompt = '';
    let temperature = 0.7;

    if (action === 'generate_question') {
      systemPrompt = 'You are an adaptive assessment engine. Return ONLY valid JSON, no markdown fences.';
      temperature = 0.7;
      prompt = `Generate ONE adaptive multiple-choice question in JSON format.

Topic: ${session.topic}
Current Difficulty: ${session.currentDifficulty}

Performance Summary:
${performanceSummary}

Rules:
- Difficulty must adapt to performance
- Exactly 4 options
- correctAnswerIndex must be 0–3
- difficulty must be one of: Beginner, Intermediate, Advanced

Return ONLY valid JSON matching this schema:
{
  "id": "string",
  "text": "string",
  "options": ["A", "B", "C", "D"],
  "correctAnswerIndex": number,
  "explanation": "string",
  "difficulty": "Beginner | Intermediate | Advanced",
  "topic": "string",
  "subtopic": "string"
}`;
    } else if (action === 'analyze_competency') {
      systemPrompt = 'You are an expert learning analytics AI. Return ONLY valid JSON, no markdown fences.';
      temperature = 0.3;
      const dataForAnalysis = session.responses.map((r: any) => {
        const q = questions.find((q: any) => q.id === r.questionId);
        return {
          topic: q?.topic,
          subtopic: q?.subtopic,
          difficulty: q?.difficulty,
          isCorrect: r.isCorrect,
          responseTime: r.responseTimeMs,
        };
      });

      prompt = `Analyze the following assessment data and return a competency profile in JSON.

Data:
${JSON.stringify(dataForAnalysis, null, 2)}

Return ONLY valid JSON with this schema:
{
  "overallLevel": "Beginner | Intermediate | Advanced",
  "topicMastery": [
    {
      "topic": "string",
      "subtopic": "string",
      "level": "Beginner | Intermediate | Advanced",
      "score": number (0-100),
      "accuracy": number (0-100),
      "averageResponseTime": number (ms)
    }
  ],
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendations": ["string"],
  "summary": "string (2-3 sentence summary)"
}`;
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai-gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API returned ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    // Clean markdown fences if present
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Assessment AI error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
