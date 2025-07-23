import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";
import { CarTable } from "@/components/inventory/CarTable";
import { FilterBar } from "@/components/inventory/FilterBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Calendar, Clock, FileText, BarChart3 } from "lucide-react";
import { Car } from "@/types/car";
import { mockStockCars, mockIncomingCars, mockKSACars, mockLogs } from "@/data/mockData";

const Index = () => {
  const [activeTab, setActiveTab] = useState('stock');
  const [filters, setFilters] = useState<any>({});
  const [cars, setCars] = useState({
    stock: mockStockCars,
    incoming: mockIncomingCars,
    ksa: mockKSACars
  });

  const handleCarUpdate = (updatedCar: Car) => {
    setCars(prev => ({
      ...prev,
      [activeTab]: prev[activeTab as keyof typeof prev].map(car => 
        car.id === updatedCar.id ? updatedCar : car
      )
    }));
  };

  const filteredCars = useMemo(() => {
    const currentCars = cars[activeTab as keyof typeof cars] || [];
    return currentCars.filter(car => {
      const matchesSearch = !filters.search || 
        car.chassisNo.toLowerCase().includes(filters.search.toLowerCase()) ||
        car.barCode.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = !filters.status || car.status === filters.status;
      const matchesModel = !filters.model || car.model === filters.model;
      const matchesBranch = !filters.branch || car.branch === filters.branch;
      const matchesColor = !filters.colorExt || car.colourExt === filters.colorExt;
      
      return matchesSearch && matchesStatus && matchesModel && matchesBranch && matchesColor;
    });
  }, [cars, activeTab, filters]);

  const followUpCars = useMemo(() => {
    const allCars = [...cars.stock, ...cars.incoming, ...cars.ksa];
    return allCars.filter(car => car.status === 'Booked' && car.aging > 3);
  }, [cars]);

  const renderContent = () => {
    switch (activeTab) {
      case 'stock':
      case 'incoming':
      case 'ksa':
        return (
          <div>
            <FilterBar onFilterChange={setFilters} />
            <CarTable 
              cars={filteredCars}
              title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Inventory`}
              onCarUpdate={handleCarUpdate}
            />
          </div>
        );
      
      case 'alerts':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Follow-Up Required
                <Badge variant="outline">{followUpCars.length} cars</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {followUpCars.length > 0 ? (
                <div className="space-y-3">
                  {followUpCars.map(car => (
                    <Alert key={car.id}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex justify-between items-center">
                          <div>
                            <strong>{car.name}</strong> (SN: {car.sn}) - Booked for {car.aging} days
                            <div className="text-sm text-muted-foreground mt-1">
                              Customer: {car.customerDetails} | Branch: {car.branch}
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-warning border-warning/20">
                            {car.aging} days
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No follow-up required at this time</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      
      case 'logs':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                System Logs
                <Badge variant="outline">{mockLogs.length} entries</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockLogs.map(log => (
                  <div key={log.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          SN {log.sn}: {log.oldStatus} → {log.newStatus}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Changed by {log.changedBy}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      
      case 'reports':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Reports & Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{cars.stock.length}</div>
                  <div className="text-sm text-muted-foreground">Stock Cars</div>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-2xl font-bold text-warning">{cars.incoming.length}</div>
                  <div className="text-sm text-muted-foreground">Incoming Cars</div>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-2xl font-bold text-success">{cars.ksa.length}</div>
                  <div className="text-sm text-muted-foreground">KSA Cars</div>
                </div>
              </div>
              <div className="mt-6 p-6 border rounded-lg bg-muted/20">
                <h3 className="font-semibold mb-4">Quick Export</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Export filtered inventory data to PDF or Excel format
                </p>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                    Export to PDF
                  </button>
                  <button className="px-4 py-2 bg-success text-success-foreground rounded-md text-sm">
                    Export to Excel
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="container mx-auto px-4 py-6">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
