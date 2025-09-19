import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Image, Download, Star, Eye, Calendar, Filter } from "lucide-react";

export default function Notes() {
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    type: "pdf" as const,
    courseId: "",
    isPublic: true,
  });

  const { data: content = [], isLoading } = useQuery({
    queryKey: ["/api/content"],
    queryFn: () => api.getContent(),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
    queryFn: () => api.getCourses(),
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return api.uploadContent(formData);
    },
    onSuccess: (newContent) => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadData({
        title: "",
        description: "",
        type: "pdf",
        courseId: "",
        isPublic: true,
      });
      toast({
        title: "Upload successful!",
        description: `"${newContent.title}" has been uploaded and is now available.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill title from filename
      if (!uploadData.title) {
        setUploadData(prev => ({
          ...prev,
          title: file.name.split('.')[0]
        }));
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !uploadData.title) {
      toast({
        title: "Missing information",
        description: "Please select a file and provide a title.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description);
    formData.append('type', uploadData.type);
    formData.append('courseId', uploadData.courseId);
    formData.append('isPublic', uploadData.isPublic.toString());

    uploadMutation.mutate(formData);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'ppt':
      case 'pptx':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'image':
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Image className="w-5 h-5 text-blue-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notes Library</h1>
            <p className="text-muted-foreground mt-1">
              Upload, organize, and share your study materials
            </p>
          </div>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-upload-notes">
                <Upload className="mr-2 h-4 w-4" />
                Upload Notes
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Upload Study Material</DialogTitle>
                <DialogDescription>
                  Share your notes with the community or keep them private for your own use.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Select File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
                    onChange={handleFileSelect}
                    data-testid="input-file-upload"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={uploadData.title}
                    onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter a descriptive title"
                    data-testid="input-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={uploadData.description}
                    onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this material covers"
                    data-testid="textarea-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course">Course (optional)</Label>
                  <Select 
                    value={uploadData.courseId}
                    onValueChange={(value) => setUploadData(prev => ({ ...prev, courseId: value }))}
                  >
                    <SelectTrigger data-testid="select-course">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific course</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="public"
                    checked={uploadData.isPublic}
                    onChange={(e) => setUploadData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="rounded border border-input"
                  />
                  <Label htmlFor="public" className="text-sm">
                    Make this publicly available to other students
                  </Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setUploadDialogOpen(false)}
                    data-testid="button-cancel-upload"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                    data-testid="button-confirm-upload"
                  >
                    {uploadMutation.isPending ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Notes</TabsTrigger>
            <TabsTrigger value="my-notes">My Notes</TabsTrigger>
            <TabsTrigger value="public">Public Library</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : content.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {content.map((item) => (
                  <Card key={item.id} className="card-hover" data-testid={`note-card-${item.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {getFileIcon(item.type)}
                          <CardTitle className="text-sm font-medium line-clamp-1">
                            {item.title}
                          </CardTitle>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.type.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                        {item.fileSize && (
                          <span>{formatFileSize(item.fileSize)}</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3" />
                            <span>{item.rating || 0}/5</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Download className="w-3 h-3" />
                            <span>{item.downloadCount}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{item.ratingCount}</span>
                          </div>
                        </div>
                        
                        <Button size="sm" variant="outline" data-testid={`button-view-${item.id}`}>
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No notes uploaded yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start building your study library by uploading your first notes.
                  </p>
                  <Button onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Your First Notes
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="my-notes" className="space-y-4">
            <div className="text-center py-12 text-muted-foreground">
              <p>Filter functionality for user's own notes would be implemented here.</p>
            </div>
          </TabsContent>

          <TabsContent value="public" className="space-y-4">
            <div className="text-center py-12 text-muted-foreground">
              <p>Public library view would be implemented here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
