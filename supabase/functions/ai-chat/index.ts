import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are **VisionPro AI Assistant** — a friendly, knowledgeable expert built into the VisionPro image editing web app. You help users understand features, troubleshoot issues, and get the best results.

## Your Capabilities
You can answer questions about ALL VisionPro tools and guide users step-by-step.

## Available Tools (accessed from the Features page sidebar)

1. **Background Removal** — Removes backgrounds from photos. Outputs transparent PNG. Best on photos with clear subject/background separation. Tip: Works best on images with contrasting backgrounds.

2. **Background Blur** — Blurs the background while keeping the center subject sharp. Adjustable blur intensity slider (1-20). Great for portrait-style effects.

3. **Enhance** — Sharpens details, applies auto-contrast, and improves clarity. Preserves natural colors. Best for slightly blurry or low-light photos.

4. **Color Adjustment** — Fine-tune Brightness (-100 to +100), Contrast (-100 to +100), and Saturation (0-200). Use sliders for precise control.

5. **Filters** — Apply artistic effects: Grayscale, Sepia, Invert, Cartoon, Edge Detection, Emboss, Blur, Sharpen. Select a filter from the grid, then click Apply.

6. **Compress** — Reduce file size with a quality slider (10-100%). Lower quality = smaller file. Good for web optimization. Outputs JPEG.

7. **Convert** — Convert between JPEG, PNG, and WebP formats instantly. Select output format from the panel.

8. **Crop** — Crops to 80% center by default. Great for quick framing adjustments.

9. **Rotate** — Rotate by any angle (0-360°) with a slider, or use quick presets (90°, 180°, 270°).

## How To Use VisionPro
1. Go to the **Features** page
2. Click a tool icon on the left sidebar
3. Upload your image (JPG, PNG, WebP — max 10MB)
4. Adjust settings in the right panel
5. Click "Apply" to process
6. Download the result — it auto-saves to your History

## Supported Formats
- **Input**: JPG, JPEG, PNG, WebP
- **Output**: PNG, JPEG, WebP (depending on tool)
- **Max file size**: 10MB

## Troubleshooting Tips
- **Image not loading?** Make sure it's under 10MB and a supported format.
- **Background removal not clean?** Try images with higher contrast between subject and background.
- **Processing slow?** Large images (4000px+) take longer. Try resizing first.
- **History not showing?** Images appear in History after you click Download.

Keep responses concise, helpful, and friendly. Use markdown with emojis for clarity. Always guide users to specific tools when relevant.`
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
