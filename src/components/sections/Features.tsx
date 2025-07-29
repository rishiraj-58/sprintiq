import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    title: 'AI Task Management',
    description: 'Let AI help you create, organize, and prioritize tasks intelligently based on your project context.',
  },
  {
    title: 'Smart Sprint Planning',
    description: 'Optimize your sprint planning with AI-powered suggestions and workload balancing.',
  },
  {
    title: 'Real-time Collaboration',
    description: 'Work seamlessly with your team in real-time with built-in chat and collaborative features.',
  },
  {
    title: 'Intelligent Analytics',
    description: 'Get actionable insights and predictions about your project health and team performance.',
  },
  {
    title: 'Document Management',
    description: 'Centralize all your project documents with smart search and version control.',
  },
  {
    title: 'Custom Workflows',
    description: 'Create and automate custom workflows that match your team\'s unique processes.',
  },
]

export function Features() {
  return (
    <section className="container py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight mb-4">
          Everything You Need to Succeed
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          SprintIQ brings together all the tools you need to manage projects effectively,
          enhanced by the power of artificial intelligence.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="border-2">
            <CardHeader>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* We can add feature-specific icons or illustrations here later */}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
} 