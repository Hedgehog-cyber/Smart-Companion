'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';
import { AppHeader } from '@/components/app-header';

const LOCAL_STORAGE_KEY_PROFILE = 'user_neuro_profile';

const profileSchema = z.object({
  task_granularity: z.string().optional(),
  sensory_triggers: z.string().optional(),
  support_requirements: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      task_granularity: '',
      sensory_triggers: '',
      support_requirements: '',
    },
  });

  useEffect(() => {
    try {
      const savedProfileJson = localStorage.getItem(LOCAL_STORAGE_KEY_PROFILE);
      if (savedProfileJson) {
        const savedProfile = JSON.parse(savedProfileJson) as UserProfile;
        form.reset({
            task_granularity: savedProfile.task_granularity || '',
            sensory_triggers: savedProfile.sensory_triggers || '',
            support_requirements: savedProfile.support_requirements || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile from localStorage:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load your profile data.',
      });
    }
  }, [form, toast]);

  const onSubmit = (data: ProfileFormValues) => {
    try {
      const profileToSave: UserProfile = {
        task_granularity: data.task_granularity || '',
        sensory_triggers: data.sensory_triggers || '',
        support_requirements: data.support_requirements || '',
      };
      localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(profileToSave));
      toast({
        title: 'Profile Saved',
        description: 'Your preferences have been updated.',
      });
    } catch (error) {
      console.error('Failed to save profile to localStorage:', error);
      toast({
        variant: 'destructive',
        title: 'Error Saving Profile',
        description: 'Your preferences could not be saved.',
      });
    }
  };

  return (
    <main className="flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4 pt-12 md:pt-20">
      <AppHeader />
      <div className="w-full max-w-2xl mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold font-headline">Your Neuro-Profile</h2>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to App
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>AI Coach Preferences</CardTitle>
            <CardDescription>
              Help the AI coach understand your needs better. The AI will use this context to tailor its suggestions for you. This information is saved only on this device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="task_granularity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Granularity</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., 'I need extra small steps for cleaning tasks' or 'Break down writing tasks more'"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Tell the AI if you need more (or fewer) steps for certain types of tasks.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sensory_triggers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sensory Triggers & Aversions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., 'Avoid mentioning loud noises' or 'I get anxious about tasks involving phone calls'"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        What should the AI avoid mentioning to prevent stress or distraction?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="support_requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specific Support Style</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., 'Keep steps strictly physical' or 'Use more encouraging words'"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        How should the AI talk to you? What style of support is most helpful?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Preferences
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
