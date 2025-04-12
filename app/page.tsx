import { Button } from "@/components/ui/button"
import Link from "next/link"

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
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <h1 className="text-3xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">MuViq-AI</h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Intelligent course project evaluator designed to assist students in submitting assignments and professors
              in evaluating them.
            </p>
            <div className="space-x-4">
              <Button asChild size="lg">
                <Link href="/login">Get Started</Link>
              </Button>
            </div>
          </div>
        </section>
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <div className="relative overflow-hidden rounded-lg border bg-background p-6">
              <div className="space-y-2">
                <h3 className="font-bold">User Management</h3>
                <p className="text-sm text-muted-foreground">
                  Professors can create and manage projects. Students can submit project documents.
                </p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-6">
              <div className="space-y-2">
                <h3 className="font-bold">AI Integration</h3>
                <p className="text-sm text-muted-foreground">
                  AI assistant to assign grades based on rubrics and provide feedback.
                </p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-6">
              <div className="space-y-2">
                <h3 className="font-bold">Engagement System</h3>
                <p className="text-sm text-muted-foreground">
                  Earn badges like "Early Bird", "Perfectionist", and "Collaborator".
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} MuViq-AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
