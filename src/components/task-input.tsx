"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  task: z.string().min(10, {
    message: "Please describe your task in a bit more detail (at least 10 characters).",
  }),
});

type TaskInputProps = {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  isPending: boolean;
};

export function TaskInput({ onSubmit, isPending }: TaskInputProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      task: "",
    },
  });

  return (
    <Card className="w-full animate-fade-in">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">What's on your mind?</CardTitle>
        <CardDescription>
          Tell me what's feeling overwhelming. We'll break it down together.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="task"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">What task is overwhelming you right now?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'Clean the entire house' or 'Finish my project report'"
                      className="min-h-[120px] text-base resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full" size="lg">
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Wand2 />
              )}
              <span>{isPending ? "Generating steps..." : "Break It Down"}</span>
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
