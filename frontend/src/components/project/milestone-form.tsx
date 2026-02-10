"use client";

import { useFieldArray, Control } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Trash2 } from "lucide-react";

interface MilestoneFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
}

export function MilestoneForm({ control }: MilestoneFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "milestones",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Milestones (Optional)</h3>
          <p className="text-xs text-muted-foreground">
            Break your project into milestones for better tracking.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ title: "", amount: 0, dueDate: "" })}>
          <Plus className="h-4 w-4 mr-1" />
          Add Milestone
        </Button>
      </div>

      {fields.length > 0 && (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-end p-3 border rounded-lg bg-muted/30">
              <FormField
                control={control}
                name={`milestones.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    {index === 0 && <FormLabel>Title</FormLabel>}
                    <FormControl>
                      <Input placeholder="Milestone title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`milestones.${index}.amount`}
                render={({ field }) => (
                  <FormItem>
                    {index === 0 && <FormLabel>Amount (IDR)</FormLabel>}
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        className="w-36"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`milestones.${index}.dueDate`}
                render={({ field }) => (
                  <FormItem>
                    {index === 0 && <FormLabel>Due Date</FormLabel>}
                    <FormControl>
                      <Input type="date" className="w-40" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
