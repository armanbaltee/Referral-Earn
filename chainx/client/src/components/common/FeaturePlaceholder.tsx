import React from 'react';
import { Layers, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';

export interface FeaturePlaceholderProps {
  title: string;
  description: string;
  category?: string;
  phase?: string;
  backHref?: string;
}

export function FeaturePlaceholder({
  title,
  description,
  category = 'ChainX Core',
  phase = 'Phase 3 Ready',
  backHref = '/dashboard',
}: FeaturePlaceholderProps): React.ReactElement {
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={backHref}>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
              <Badge variant="outline" className="text-[10px]">
                {category}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {phase}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
      </div>

      <Card className="p-8 text-center border-dashed border-2 border-border/80">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
          <Layers className="h-7 w-7" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title} Architecture Initialized</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto mt-2 leading-relaxed">
          The UI shell, state stores, and backend models for {title} are fully wired into the
          ChainX design system. Detailed transactional forms and real-time feeds will activate in
          the upcoming feature module phases.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link to={backHref}>
            <Button size="sm" variant="default" className="text-xs">
              Return to Overview
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
