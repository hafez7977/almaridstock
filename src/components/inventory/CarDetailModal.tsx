import { useState } from "react";
import { Car } from "@/types/car";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Save, X } from "lucide-react";

interface CarDetailModalProps {
  car: Car;
  onClose: () => void;
  onUpdate: (car: Car) => void;
}

export const CarDetailModal = ({ car, onClose, onUpdate }: CarDetailModalProps) => {
  const [editedCar, setEditedCar] = useState<Car>(car);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onUpdate(editedCar);
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Available': 'bg-success/10 text-success border-success/20',
      'Booked': 'bg-warning/10 text-warning border-warning/20',
      'Sold': 'bg-destructive/10 text-destructive border-destructive/20'
    };
    return colors[status as keyof typeof colors] || 'bg-muted';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              Car Details - {car.name}
              <Badge className={getStatusColor(editedCar.status)}>
                {editedCar.status}
              </Badge>
            </DialogTitle>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SN</Label>
                <Input value={editedCar.sn} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Status</Label>
                {isEditing ? (
                  <Select
                    value={editedCar.status}
                    onValueChange={(value) => setEditedCar({...editedCar, status: value as Car['status']})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Booked">Booked</SelectItem>
                      <SelectItem value="Sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={editedCar.status} disabled className="bg-muted" />
                )}
              </div>
            </div>

            <div>
              <Label>Name</Label>
              <Input value={editedCar.name} disabled className="bg-muted" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Model</Label>
                <Input value={editedCar.model} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Spec Code</Label>
                <Input value={editedCar.specCode} disabled className="bg-muted" />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={editedCar.description} disabled className="bg-muted" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Exterior Color</Label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded border border-border"
                    style={{ backgroundColor: editedCar.colourExt.toLowerCase() }}
                  />
                  <Input value={editedCar.colourExt} disabled className="bg-muted" />
                </div>
              </div>
              <div>
                <Label>Interior Color</Label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded border border-border"
                    style={{ backgroundColor: editedCar.colourInt.toLowerCase() }}
                  />
                  <Input value={editedCar.colourInt} disabled className="bg-muted" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Chassis No</Label>
                <Input value={editedCar.chassisNo} disabled className="bg-muted font-mono" />
              </div>
              <div>
                <Label>Engine No</Label>
                <Input value={editedCar.engineNo} disabled className="bg-muted font-mono" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Supplier</Label>
                <Input value={editedCar.supplier} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Branch</Label>
                <Input value={editedCar.branch} disabled className="bg-muted" />
              </div>
            </div>

            <div>
              <Label>Place</Label>
              <Input value={editedCar.place} disabled className="bg-muted" />
            </div>

            <div>
              <Label>Customer Details</Label>
              {isEditing ? (
                <Textarea
                  value={editedCar.customerDetails}
                  onChange={(e) => setEditedCar({...editedCar, customerDetails: e.target.value})}
                  placeholder="Enter customer details..."
                />
              ) : (
                <Textarea value={editedCar.customerDetails || 'No customer details'} disabled className="bg-muted" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Received Date
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editedCar.receivedDate}
                    onChange={(e) => setEditedCar({...editedCar, receivedDate: e.target.value})}
                  />
                ) : (
                  <Input value={editedCar.receivedDate} disabled className="bg-muted" />
                )}
              </div>
              <div>
                <Label>Aging (Days)</Label>
                <Input 
                  value={`${editedCar.aging} days`} 
                  disabled 
                  className="bg-muted font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>SP</Label>
                <Input value={editedCar.sp} disabled className="bg-muted" />
              </div>
              <div>
                <Label>S/D</Label>
                <Input value={editedCar.sd} disabled className="bg-muted" />
              </div>
              <div>
                <Label>INV #</Label>
                <Input value={editedCar.invNo} disabled className="bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};