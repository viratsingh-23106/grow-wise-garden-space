
import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
}

const ReviewForm = ({ productId, onSuccess }: ReviewFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in to submit a review");
      if (rating === 0) throw new Error("Please select a rating");

      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating,
          review_text: reviewText.trim() || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review submitted successfully!");
      setRating(0);
      setReviewText("");
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-stats', productId] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit review");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReviewMutation.mutate();
  };

  if (!user) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600 mb-4">Please sign in to leave a review</p>
        <Button variant="outline">Sign In</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Write a Review</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Rating
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="p-1 hover:scale-110 transition-transform"
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
            >
              <Star
                className={`h-6 w-6 ${
                  star <= (hoveredRating || rating)
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Review (Optional)
        </label>
        <Textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={4}
          maxLength={1000}
        />
        <p className="text-sm text-gray-500 mt-1">
          {reviewText.length}/1000 characters
        </p>
      </div>

      <Button
        type="submit"
        disabled={rating === 0 || submitReviewMutation.isPending}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
};

export default ReviewForm;
