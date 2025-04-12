"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Calendar, CheckCircle, Clock } from "lucide-react"

interface Badge {
  id: string;
  name: string;
  studentId: string;
  awardedDate: string;
  createdAt: string;
  updatedAt: string;
}

interface BadgeDisplay extends Badge {
  description: string;
  icon: React.ReactNode;
  earned: boolean;
}

export function BadgeGrid() {
  const [badges, setBadges] = useState<BadgeDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/badges');
        
        if (!response.ok) {
          throw new Error('Failed to fetch badges');
        }
        
        const data: Badge[] = await response.json();
        
        // Transform the badges data to include descriptions and icons
        const badgeDisplays: BadgeDisplay[] = data.map(badge => {
          let description = '';
          let icon = null;
          
          switch(badge.name) {
            case 'EarlyBird':
              description = 'Awarded for submitting assignments before the deadline';
              icon = <Clock className="h-8 w-8" />;
              break;
            case 'Perfectionist':
              description = 'Awarded for achieving a perfect score on an assignment';
              icon = <CheckCircle className="h-8 w-8" />;
              break;
            case 'Collaborator':
              description = 'Awarded for active participation in discussions';
              icon = <Award className="h-8 w-8" />;
              break;
            default:
              description = 'Achievement badge';
              icon = <Award className="h-8 w-8" />;
          }
          
          return {
            ...badge,
            description,
            icon,
            earned: true,
          };
        });
        
        // Add unearned badges if not present
        const badgeTypes = ['EarlyBird', 'Perfectionist', 'Collaborator'];
        const earnedBadgeTypes = badgeDisplays.map(badge => badge.name);
        
        badgeTypes.forEach(type => {
          if (!earnedBadgeTypes.includes(type)) {
            let description = '';
            let icon = null;
            
            switch(type) {
              case 'EarlyBird':
                description = 'Awarded for submitting assignments before the deadline';
                icon = <Clock className="h-8 w-8" />;
                break;
              case 'Perfectionist':
                description = 'Awarded for achieving a perfect score on an assignment';
                icon = <CheckCircle className="h-8 w-8" />;
                break;
              case 'Collaborator':
                description = 'Awarded for active participation in discussions';
                icon = <Award className="h-8 w-8" />;
                break;
            }
            
            badgeDisplays.push({
              id: `unearned-${type}`,
              name: type,
              studentId: '',
              awardedDate: '',
              createdAt: '',
              updatedAt: '',
              description,
              icon,
              earned: false,
            });
          }
        });
        
        setBadges(badgeDisplays);
      } catch (err) {
        console.error('Error fetching badges:', err);
        setError('Failed to load badges. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not earned yet"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading badges...</div>;
  }

  if (error) {
    return <div className="flex justify-center p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {badges.map((badge) => (
        <Card key={badge.id} className={`${badge.earned ? "border-primary" : "border-muted opacity-70"}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>{badge.name}</CardTitle>
              <div className={`${badge.earned ? "text-primary" : "text-muted-foreground"}`}>{badge.icon}</div>
            </div>
            <CardDescription>{badge.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{badge.earned ? `Earned on ${formatDate(badge.awardedDate)}` : "Not earned yet"}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
