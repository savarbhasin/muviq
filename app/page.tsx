import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Book, Code, Star, BarChart, UserPlus, Shield, Zap } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col w-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-xl">MuViq-AI</span>
            </Link>
            
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-2">
              
              <Button asChild variant="outline">
                <Link href="/login">Login</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="space-y-6 min-h-[20rem] pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32 bg-gradient-to-b from-background to-muted/30">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <h1 className="text-3xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">MuViq-AI</h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Intelligent course project evaluator designed to assist students in submitting assignments and professors
              in evaluating them.
            </p>
            <div className="space-x-4 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="px-8">
                <Link href="/login">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/demo">Watch Demo</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">Powerful Features</h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Everything you need to evaluate projects efficiently and provide meaningful feedback
            </p>
          </div>
          
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <div className="relative overflow-hidden rounded-lg border bg-background p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <UserPlus className="h-5 w-5" />
              </div>
              <div className="space-y-2 mt-4">
                <h3 className="font-bold">User Management</h3>
                <p className="text-sm text-muted-foreground">
                  Professors can create and manage projects. Students can submit project documents seamlessly.
                </p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Zap className="h-5 w-5" />
              </div>
              <div className="space-y-2 mt-4">
                <h3 className="font-bold">AI Integration</h3>
                <p className="text-sm text-muted-foreground">
                  AI assistant to assign grades based on rubrics and provide detailed constructive feedback.
                </p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Star className="h-5 w-5" />
              </div>
              <div className="space-y-2 mt-4">
                <h3 className="font-bold">Engagement System</h3>
                <p className="text-sm text-muted-foreground">
                  Earn badges like "Early Bird", "Perfectionist", and "Collaborator" to motivate students.
                </p>
              </div>
            </div>
            
          </div>
        </section>

        {/* How It Works */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24 bg-muted/50">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">How It Works</h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Simple, intuitive, and effective project evaluation in three easy steps
            </p>
          </div>
          
          <div className="mx-auto grid justify-center gap-6 sm:grid-cols-1 md:max-w-[64rem] md:grid-cols-3 mt-12">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">1</div>
              <h3 className="text-xl font-bold mb-2">Create Project</h3>
              <p className="text-muted-foreground">Professors set up projects with detailed requirements and custom rubrics.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">2</div>
              <h3 className="text-xl font-bold mb-2">Submit Work</h3>
              <p className="text-muted-foreground">Students upload their assignments through an intuitive interface.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">3</div>
              <h3 className="text-xl font-bold mb-2">Receive Feedback</h3>
              <p className="text-muted-foreground">AI provides comprehensive evaluation with actionable insights.</p>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">What Our Users Say</h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Join the community of educators and students enhancing the learning experience
            </p>
          </div>
          
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] lg:grid-cols-3 mt-12">
            <div className="rounded-lg border bg-background p-6">
              <p className="text-muted-foreground mb-4">"MuViq-AI has transformed how I evaluate student projects. I save hours of time while providing more detailed feedback."</p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-muted"></div>
                <div className="ml-4">
                  <p className="font-medium">Dr. Sarah Chen</p>
                  <p className="text-sm text-muted-foreground">Professor of Computer Science</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-background p-6">
              <p className="text-muted-foreground mb-4">"The immediate feedback I get on my assignments helps me understand where I need to improve. The badge system is actually motivating!"</p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-muted"></div>
                <div className="ml-4">
                  <p className="font-medium">Miguel Rodriguez</p>
                  <p className="text-sm text-muted-foreground">Computer Engineering Student</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-background p-6">
              <p className="text-muted-foreground mb-4">"Implementation was seamless with our existing LMS. The analytics provide valuable insights for curriculum development."</p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-muted"></div>
                <div className="ml-4">
                  <p className="font-medium">Dr. James Wilson</p>
                  <p className="text-sm text-muted-foreground">Department Chair</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container space-y-6 py-8 md:py-12 lg:py-24 bg-primary text-primary-foreground rounded-lg">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">Ready to Transform Project Evaluation?</h2>
            <p className="max-w-[85%] leading-normal sm:text-lg sm:leading-7">
              Join educators from leading institutions who are already using MuViq-AI
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Button asChild size="lg" variant="secondary" className="px-8">
                <Link href="/register">Sign Up Free</Link>
              </Button>
              
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container py-8 md:py-12">
          {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-sm text-muted-foreground hover:text-foreground">Features</Link></li>
                <li><Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link></li>
                <li><Link href="/integrations" className="text-sm text-muted-foreground hover:text-foreground">Integrations</Link></li>
                <li><Link href="/changelog" className="text-sm text-muted-foreground hover:text-foreground">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="/documentation" className="text-sm text-muted-foreground hover:text-foreground">Documentation</Link></li>
                <li><Link href="/guides" className="text-sm text-muted-foreground hover:text-foreground">Guides</Link></li>
                <li><Link href="/api" className="text-sm text-muted-foreground hover:text-foreground">API</Link></li>
                <li><Link href="/support" className="text-sm text-muted-foreground hover:text-foreground">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">About Us</Link></li>
                <li><Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">Blog</Link></li>
                <li><Link href="/careers" className="text-sm text-muted-foreground hover:text-foreground">Careers</Link></li>
                <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="/security" className="text-sm text-muted-foreground hover:text-foreground">Security</Link></li>
              </ul>
            </div>
          </div> */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t pt-8 mt-8">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} MuViq-AI. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">Twitter</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">GitHub</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">LinkedIn</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}