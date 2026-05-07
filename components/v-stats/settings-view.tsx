"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export function SettingsView() {
  const [notifications, setNotifications] = useState({
    matchReminders: true,
    teamUpdates: true,
    weeklyReports: false,
    liveScores: true,
  })

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and app preferences</p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="app">App Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Account Preferences */}
        <TabsContent value="account">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Account Preferences</CardTitle>
              <CardDescription>Manage your personal account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-foreground">Display Name</Label>
                  <Input
                    id="displayName"
                    defaultValue="Coach Johnson"
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="coach@thundervc.com"
                    className="bg-input border-border"
                  />
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-foreground">Change Password</Label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Current password"
                    className="bg-input border-border"
                  />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="New password"
                    className="bg-input border-border"
                  />
                </div>
              </div>

              <Button className="bg-[#0a67ec] hover:bg-[#0a67ec]/90 text-white">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* App Settings */}
        <TabsContent value="app">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">App Settings</CardTitle>
              <CardDescription>Configure how V-Stats works for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-foreground">Timezone</Label>
                  <Select defaultValue="pst">
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                      <SelectItem value="mst">Mountain Time (MST)</SelectItem>
                      <SelectItem value="cst">Central Time (CST)</SelectItem>
                      <SelectItem value="est">Eastern Time (EST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat" className="text-foreground">Date Format</Label>
                  <Select defaultValue="mdy">
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Data & Privacy</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Public Profile</p>
                    <p className="text-sm text-muted-foreground">
                      Allow others to view your team statistics
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Analytics</p>
                    <p className="text-sm text-muted-foreground">
                      Help improve V-Stats with anonymous usage data
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Button className="bg-[#0a67ec] hover:bg-[#0a67ec]/90 text-white">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Notification Toggles</CardTitle>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Match Reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified before scheduled matches
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.matchReminders}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, matchReminders: checked })
                    }
                  />
                </div>

                <Separator className="bg-border" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Team Updates</p>
                    <p className="text-sm text-muted-foreground">
                      Roster changes and team announcements
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.teamUpdates}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, teamUpdates: checked })
                    }
                  />
                </div>

                <Separator className="bg-border" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Weekly Reports</p>
                    <p className="text-sm text-muted-foreground">
                      Receive a summary of weekly statistics
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, weeklyReports: checked })
                    }
                  />
                </div>

                <Separator className="bg-border" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Live Score Updates</p>
                    <p className="text-sm text-muted-foreground">
                      Real-time notifications during matches
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.liveScores}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, liveScores: checked })
                    }
                  />
                </div>
              </div>

              <Button className="bg-[#0a67ec] hover:bg-[#0a67ec]/90 text-white">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
