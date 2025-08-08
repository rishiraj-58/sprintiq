import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

export function Hero() {
  return (
    <div className="container relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center">
      <div className="mx-auto max-w-3xl space-y-8">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
          Supercharge Your Project Management with{' '}
          <span className="text-primary">AI</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          SprintIQ combines intelligent task management, team collaboration, and AI-powered insights
          to help you deliver projects faster and smarter.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/get-started">
            <Button size="lg" className="w-full sm:w-auto">
              Get Started Free
            </Button>
          </Link>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                See How It Works
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">AI-Powered Project Management</h4>
                <p className="text-sm">
                  Watch a 2-minute demo of how SprintIQ uses AI to streamline your project workflow,
                  from task creation to intelligent insights.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
      <div className="absolute bottom-8 w-full max-w-xl mx-auto px-4">
        <div className="grid grid-cols-3 gap-8 text-sm text-muted-foreground">
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-foreground">10x</div>
            Faster Planning
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-foreground">50%</div>
            Less Meetings
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-foreground">24/7</div>
            AI Assistant
          </div>
        </div>
      </div>
    </div>
  )
} 