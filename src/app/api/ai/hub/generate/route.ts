import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateAIResponse } from '@/lib/ai/client';

const DOCUMENT_SYSTEM_PROMPT = `You are SprintIQ's AI Document Generator, specialized in creating high-quality technical documentation, specifications, and analysis reports.

**Your Role:**
- Generate comprehensive, well-structured documents
- Create Mermaid diagrams when appropriate
- Provide actionable insights and recommendations
- Use professional tone with clear formatting

**Output Guidelines:**
1. **Structure**: Use clear headings, bullet points, and sections
2. **Diagrams**: When creating flowcharts or diagrams, use Mermaid syntax in \`\`\`mermaid code blocks
3. **Technical Specs**: Include implementation details, requirements, and considerations
4. **Analysis**: Provide data-driven insights with specific recommendations
5. **Format**: Use Markdown for rich formatting

**Available Mermaid Diagram Types:**
- \`flowchart TD\` for process flows
- \`sequenceDiagram\` for interactions
- \`classDiagram\` for system architecture
- \`gantt\` for project timelines
- \`graph\` for relationships

**Example Mermaid Flowchart:**
\`\`\`mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
\`\`\`

**Response Format:**
Return a JSON object with:
- \`title\`: A descriptive title for the generated content
- \`content\`: The full markdown content
- \`type\`: "document", "diagram", or "analysis"

Remember: Be comprehensive, practical, and actionable in your outputs.`;

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { prompt, userId, type = 'document', chatHistory = [] } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Determine content type based on prompt keywords
    let detectedType = type;
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('diagram') || promptLower.includes('flowchart') || promptLower.includes('mermaid')) {
      detectedType = 'diagram';
    } else if (promptLower.includes('analyze') || promptLower.includes('report') || promptLower.includes('assessment')) {
      detectedType = 'analysis';
    }

    // Build conversation context
    const messages: Array<{ role: 'user' | 'system' | 'assistant' | 'tool'; content: string }> = [
      { role: 'system', content: DOCUMENT_SYSTEM_PROMPT }
    ];

    // Add chat history for context
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.slice(-4).forEach((msg: any) => {
        if (msg.type === 'user') {
          messages.push({ role: 'user', content: msg.content });
        } else if (msg.type === 'assistant') {
          messages.push({ role: 'assistant', content: msg.content });
        }
      });
    }

    // Generate content with enhanced prompt
    const enhancedPrompt = `${prompt}

**Context:** This is for SprintIQ project management platform. Focus on practical, implementable solutions.
**Output Type:** ${detectedType}
**Format:** Return a JSON object with title, content (markdown), and type fields.`;

    messages.push({ role: 'user', content: enhancedPrompt });

    const response = await generateAIResponse({
      messages,
      maxTokens: 4000,
      temperature: 0.7,
      model: 'gpt-4o'
    });

    // Try to parse the response as JSON
    let result;
    try {
      // Look for JSON in the response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0].replace(/```json\s*|\s*```/g, ''));
      } else {
        // If no JSON found, create a structured response
        result = {
          title: `Generated ${detectedType.charAt(0).toUpperCase() + detectedType.slice(1)}`,
          content: response,
          type: detectedType
        };
      }
    } catch (parseError) {
      // Fallback if JSON parsing fails
      result = {
        title: `Generated ${detectedType.charAt(0).toUpperCase() + detectedType.slice(1)}`,
        content: response,
        type: detectedType
      };
    }

    // Ensure we have required fields
    if (!result.title) {
      result.title = `Generated ${detectedType.charAt(0).toUpperCase() + detectedType.slice(1)}`;
    }
    if (!result.content) {
      result.content = response;
    }
    if (!result.type) {
      result.type = detectedType;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Hub generation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
