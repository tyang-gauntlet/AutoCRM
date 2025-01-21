import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Users,
  MessageSquare,
  Bot,
  BarChart3,
  ArrowRight,
  Sparkles
} from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: <Bot className="h-6 w-6" />,
      title: "AI-Powered Automation",
      description: "Let AI handle routine customer interactions while you focus on what matters most."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Customer Management",
      description: "Keep track of all your customers and their interactions in one place."
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Smart Interactions",
      description: "Engage with customers through automated, personalized communications."
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Analytics & Insights",
      description: "Make data-driven decisions with comprehensive analytics and reporting."
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="ml-2 text-xl font-bold">AutoCRM</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
            Customer Relationships,{' '}
            <span className="text-primary">Automated</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Streamline your customer interactions with AI-powered automation.
            Let technology handle the routine while you focus on building meaningful relationships.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Start for Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Live Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need</h2>
            <p className="text-muted-foreground">
              Powerful features to help you manage and grow your customer relationships
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-background p-6 rounded-lg border hover:border-primary/50 transition-colors"
              >
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to transform your customer relationships?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of businesses using AutoCRM to automate and improve their customer interactions.
          </p>
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Get Started Now
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="ml-2 font-semibold">AutoCRM</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 AutoCRM. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
