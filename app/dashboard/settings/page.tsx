"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  const { data: session } = useSession()
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      <Separator />
      <Tabs defaultValue="account" className="w-full">
        {/* <TabsList className="grid w-full">
          <TabsTrigger value="account">Account</TabsTrigger>
          
        </TabsList> */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Update your account information and email address.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue={session?.user?.name || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={session?.user?.email || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" disabled value={session?.user?.role || ""} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave}>{saved ? "Saved!" : "Save Changes"}</Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Change your password here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current Password</Label>
                <Input id="current" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New Password</Label>
                <Input id="new" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input id="confirm" type="password" />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave}>{saved ? "Saved!" : "Change Password"}</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        {/* <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure how you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="email-notifs">Email Notifications</Label>
                <Switch id="email-notifs" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="assignment-notifs">Assignment Reminders</Label>
                <Switch id="assignment-notifs" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="grade-notifs">Grade Updates</Label>
                <Switch id="grade-notifs" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="badge-notifs">Badge Notifications</Label>
                <Switch id="badge-notifs" defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave}>{saved ? "Saved!" : "Save Preferences"}</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <Switch id="dark-mode" />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="compact-view">Compact View</Label>
                <Switch id="compact-view" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="font-size">Font Size</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm">Small</Button>
                  <Button variant="secondary" size="sm">Medium</Button>
                  <Button variant="outline" size="sm">Large</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave}>{saved ? "Saved!" : "Save Preferences"}</Button>
            </CardFooter>
          </Card>
        </TabsContent> */}
      </Tabs>
    </div>
  )
}
