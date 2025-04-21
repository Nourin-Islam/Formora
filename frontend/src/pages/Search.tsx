import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";

import { MoreHorizontal, Heart, MessageSquare, Plus, Edit, Eye, Check } from "lucide-react";
import TemplatesSkeleton from "@/components/global/TemplatesSkeleton";
import { toast } from "sonner";
import { useAuth } from "@clerk/clerk-react";

import { FilterOptions, Template } from "@/types/index";

import { useLikeTemplate, useUnlikeTemplate } from "@/hooks/useTemplateInteractions";
import { publicApi } from "@/lib/api";

export default function SearchPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";

  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    page: 1,
    limit: 6,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [totalPages, setTotalPages] = useState(0);

  // Fetch search results when query or filters change
  const fetchSearchResults = async () => {
    if (!query) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await publicApi.get("/search", {
        params: {
          q: query,
          ...filters,
        },
      });
      setTemplates(response.data.templates || []);
      setTotalPages(response.data.totalPages || 0);
    } catch (err) {
      setError("Failed to load search results");
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchSearchResults();
  }, [query, filters]);

  // Template mutations
  const { mutate: addLike } = useLikeTemplate(filters);
  const { mutate: removeLike } = useUnlikeTemplate(filters);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLike = (templateId: number) => {
    if (!userId) {
      toast.info("Please sign in to like templates");
      return;
    }

    // add like to the template
    setTemplates((prev) =>
      prev.map((template) => {
        if (template.id === templateId) {
          return { ...template, likesCount: template.likesCount + 1, peopleLiked: [...template.peopleLiked, userId as string] };
        }
        return template;
      })
    );
    addLike(templateId, {
      onSuccess: () => {
        toast.success("Successfully add a like.");
      },
      onError: (error) => {
        console.error("Error toggling like:", error);
        toast.error("Failed to update like status");
        setTimeout(() => {
          fetchSearchResults();
        }, 30000);
      },
    });
  };

  const handleUnLike = (templateId: number) => {
    if (!userId) {
      toast.info("Please sign in to Unlike templates");
      return;
    }

    // add like to the template
    setTemplates((prev) =>
      prev.map((template) => {
        if (template.id === templateId) {
          return { ...template, likesCount: template.likesCount - 1, peopleLiked: [...template.peopleLiked, userId as string] };
        }
        return template;
      })
    );

    removeLike(templateId, {
      onSuccess: () => {
        toast.success("Successfully removed a like.");
      },
      onError: (error) => {
        console.error("Error toggling like:", error);
        toast.error("Failed to update like status");
        setTimeout(() => {
          fetchSearchResults();
        }, 30000);
      },
    });
  };

  const handleEditTemplate = (id: number) => {
    navigate(`/edit-template/${id}`);
  };

  const handleViewTemplate = (id: number) => {
    navigate(`/fill-form/${id}`);
  };

  const createNewTemplate = () => {
    navigate("/create-template");
  };

  if (isLoading) {
    return <TemplatesSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  console.log("Templates: ", templates);
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Search Results for "{query}"</h1>
        <Button onClick={createNewTemplate} className="ml-auto">
          <Plus className="mr-2 h-4 w-4" /> Create Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">No templates found matching "{query}"</p>
          <Button onClick={createNewTemplate} className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Create a new template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template: Template) => (
            <Card key={template.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-1 line-clamp-2">{template.title}</CardTitle>
                    <CardDescription className="text-sm">
                      by {template.user.name} • {format(new Date(template.createdAt), "MMM d, yyyy")}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewTemplate(template.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      {userId === template.user.clerkId && (
                        <>
                          <DropdownMenuItem onClick={() => handleEditTemplate(template.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                    {template.topic.name}
                  </Badge>
                  {template.isPublic ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                      Public
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                      Private
                    </Badge>
                  )}
                  {template.isPublished ? (
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                      Draft
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-gray-600 line-clamp-3">{template.description}</p>
                <div className="mt-4 flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag.id} variant="outline" className="mr-1">
                      {tag.name}
                    </Badge>
                  ))}
                  {template.tags.length > 3 && <Badge variant="outline">+{template.tags.length - 3} more</Badge>}
                </div>
                <div className="mt-3">
                  <Badge variant="outline" className="bg-purple-50">
                    <Check className="mr-1 h-3 w-3" /> {template.questionCount} questions
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex justify-between border-t">
                <Button variant="ghost" size="sm" onClick={() => (template.peopleLiked.includes(userId as string) ? handleUnLike(template.id) : handleLike(template.id))} className={template.peopleLiked.includes(userId as string) ? "text-red-500" : ""}>
                  <Heart className={`mr-1 h-4 w-4 ${template.peopleLiked.includes(userId as string) ? "fill-current" : ""}`} />
                  {template.likesCount}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleViewTemplate(template.id)}>
                  <MessageSquare className="mr-1 h-4 w-4" />
                  {template.commentCount}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination>
            <Button variant="outline" onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1}>
              Previous
            </Button>
            <div className="flex items-center mx-4">
              Page {filters.page} of {totalPages}
            </div>
            <Button variant="outline" onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === totalPages}>
              Next
            </Button>
          </Pagination>
        </div>
      )}
    </div>
  );
}
