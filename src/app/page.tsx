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
      icon: <Bot className="w-6 h-6" />,
      title: "AI-Powered Automation",
      description: "Let AI handle routine customer interactions while you focus on what matters most."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Customer Management",
      description: "Keep track of all your customers and their interactions in one place."
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Smart Interactions",
      description: "Engage with customers through automated, personalized communications."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Analytics & Insights",
      description: "Make data-driven decisions with comprehensive analytics and reporting."
    }
  ]

  return (
    <div className="bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="ml-2 text-xl font-bold">AutoCRM</span>
            </div>
            <div className="flex gap-4 items-center">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/login">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Customer Relationships,{' '}
            <span className="text-primary">Automated</span>
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Streamline your customer interactions with AI-powered automation.
            Let technology handle the routine while you focus on building meaningful relationships.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/login">
                Start for Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Live Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/50">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold">Everything you need</h2>
            <p className="text-muted-foreground">
              Powerful features to help you manage and grow your customer relationships
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-lg border transition-colors bg-background hover:border-primary/50"
              >
                <div className="mb-4 text-primary">{feature.icon}</div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="px-4 mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold">
            Ready to transform your customer relationships?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Join thousands of businesses using AutoCRM to automate and improve their customer interactions.
          </p>
          <Button size="lg" className="gap-2" asChild>
            <Link href="/signup">
              Get Started Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Sparkles className="w-5 h-5 text-primary" />
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
