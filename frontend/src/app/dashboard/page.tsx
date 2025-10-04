import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MessageCircleIcon, PlayIcon } from "lucide-react"

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col items-center justify-center p-6 gap-8">
            <div className="text-center space-y-4 max-w-2xl">
              <h1 className="text-4xl font-bold tracking-tight">Welcome to EUNOIA</h1>
              <p className="text-lg text-muted-foreground">
                Your personal space for reflection and growth through voice-guided sessions.
              </p>
            </div>
            
            <Link href="/session">
              <Button size="lg" className="gap-2 text-lg px-8 py-6">
                <PlayIcon className="h-5 w-5" />
                Start Session
              </Button>
            </Link>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              <MessageCircleIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Click above to begin your therapy session</p>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
