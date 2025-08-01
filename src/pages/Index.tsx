import React, { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { CarTable } from '@/components/inventory/CarTable';
import { FilterBar } from '@/components/inventory/FilterBar';
import { SpecsUpload } from '@/components/inventory/SpecsUpload';
import { Car } from '@/types/car';
import { excelExportService } from '@/services/excelExport';
const generateCSV = (cars: Car[]) => {
  const headers = ['SN', 'Status', 'Name', 'Model', 'Barcode', 'Chassis No', 'Color Ext', 'Color Int', 'Branch', 'Customer', 'Received Date', 'Aging'];
  const csvRows = [
    headers.join(','),
    ...cars.map(car => [
      car.sn,
      car.status,
      `"${car.name || ''}"`,
      `"${car.model || ''}"`,
      car.barCode || '',
      car.chassisNo || '',
      `"${car.colourExt || ''}"`,
      `"${car.colourInt || ''}"`,
      `"${car.branch || ''}"`,
      `"${car.customerDetails || ''}"`,
      car.receivedDate || '',
      car.aging || 0
    ].join(','))
  ];
  return csvRows.join('\n');
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogEntry } from '@/types/car';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { Calendar, FileText, AlertTriangle, BarChart3, Loader2, Download } from 'lucide-react';
import { MultiFilters, filterCars, sortCarsWithPriority, getAvailableCars, getBookedCars, isAvailable, isBooked } from '@/utils/carFilters';
import { ReportGenerator } from '@/components/inventory/ReportGenerator';
import { SPTracker } from '@/components/reports/SPTracker';

const Index = () => {
  const [activeTab, setActiveTab] = useState('stock');
  const [filters, setFilters] = useState<MultiFilters>({
    search: '',
    statuses: [],
    models: [],
    barcodes: [],
    descriptions: [],
    years: [],
    colorsExt: [],
    colorsInt: [],
    specCodes: [],
    branches: [],
    sp: [],
    deals: []
  });

  const { isAuthenticated, spreadsheetId } = useGoogleAuth();
  const { isAdmin } = useAdmin();
  const { 
    stockCars, 
    incomingCars, 
    ksaCars, 
    logs, 
    isLoading, 
    error,
    updateCar 
  } = useGoogleSheets();

  const handleCarUpdate = async (updatedCar: Car) => {
    const sheetName = 
      stockCars.find(car => car.id === updatedCar.id) ? 'Stock' :
      incomingCars.find(car => car.id === updatedCar.id) ? 'Incoming' :
      'KSA';
    
    // Find the original car to get the old status
    const originalCar = 
      stockCars.find(car => car.id === updatedCar.id) ||
      incomingCars.find(car => car.id === updatedCar.id) ||
      ksaCars.find(car => car.id === updatedCar.id);
    
    await updateCar(updatedCar, sheetName, originalCar?.status);
  };

  const handleExportToExcel = async () => {
    const tabName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    const filename = excelExportService.generateFilename(tabName, filters);
    await excelExportService.exportCarsToExcel(filteredCars, filename, tabName);
  };

  const filteredCars = useMemo(() => {
    const currentCars = 
      activeTab === 'stock' ? stockCars || [] :
      activeTab === 'incoming' ? incomingCars || [] :
      ksaCars || [];

    // Debug: Log KSA cars data to see actual status values
    if (activeTab === 'ksa' && ksaCars && ksaCars.length > 0) {
      console.log('KSA Cars raw data:', ksaCars.slice(0, 5).map(car => ({
        sn: car.sn,
        status: car.status,
        place: car.place,
        barCode: car.barCode
      })));
    }

    // Apply filters using the utility function
    const filtered = filterCars(currentCars, filters);
    
    // Sort with Available and Booked first
    return sortCarsWithPriority(filtered, activeTab);
  }, [stockCars, incomingCars, ksaCars, activeTab, filters]);

  // Cars that need follow up (Booked status and aging > 3 days)
  const followUpCars = useMemo(() => {
    if (!stockCars || !incomingCars || !ksaCars) return [];
    const allCars = [...stockCars, ...incomingCars, ...ksaCars];
    return allCars.filter(car => isBooked(car.status) && car.aging > 3);
  }, [stockCars, incomingCars, ksaCars]);

  // Available cars counts
  const availableCounts = useMemo(() => {
    // Debug: Log all unique statuses to see what we're working with
    const allCars = [...(stockCars || []), ...(incomingCars || []), ...(ksaCars || [])];
    const allStatuses = [...new Set(allCars.map(car => car.status))];
    console.log('All unique statuses in data:', allStatuses);
    
    // Debug: Log which cars are being counted as available
    const stockAvailable = stockCars?.filter(car => {
      const isAvail = isAvailable(car.status);
      if (isAvail) console.log(`Stock Available: SN ${car.sn}, Status: "${car.status}"`);
      return isAvail;
    }) || [];
    
    return {
      stock: stockAvailable.length,
      incoming: incomingCars?.filter(car => isAvailable(car.status)).length || 0,
      ksa: ksaCars?.filter(car => isAvailable(car.status)).length || 0,
    };
  }, [stockCars, incomingCars, ksaCars]);

  // Booked cars counts
  const bookedCounts = useMemo(() => {
    return {
      stock: stockCars?.filter(car => isBooked(car.status)).length || 0,
      incoming: incomingCars?.filter(car => isBooked(car.status)).length || 0,
      ksa: ksaCars?.filter(car => isBooked(car.status)).length || 0,
    };
  }, [stockCars, incomingCars, ksaCars]);

  const renderContent = () => {
    switch (activeTab) {
      case 'stock':
      case 'incoming':
      case 'ksa':
        return (
          <div>
            {/* Only show FilterBar and Export when we have data loaded */}
            {!isLoading && (
              <div className="space-y-4">
                <FilterBar 
                  cars={
                    activeTab === 'stock' ? stockCars || [] :
                    activeTab === 'incoming' ? incomingCars || [] :
                    ksaCars || []
                  } 
                  onFilterChange={setFilters} 
                />
                
                {/* Export to Excel Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleExportToExcel}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={filteredCars.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    Export by filter ({filteredCars.length} cars)
                  </Button>
                </div>
              </div>
            )}
            {/* Show loading state while data is loading */}
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading inventory data...</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <CarTable 
                cars={filteredCars}
                title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Inventory`}
                onCarUpdate={handleCarUpdate}
                isKsaTab={activeTab === 'ksa'}
              />
            )}
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
                            <div className="text-sm text-muted-foreground">
                              SP: {car.sp || 'N/A'} | AMPI #: {car.ampi || 'N/A'}
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
                <Badge variant="outline">{logs?.length || 0} entries</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs && logs.length > 0 ? (
                  logs.map((log) => (
                    <Card key={log.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Car SN: {log.sn}</p>
                            <p className="text-sm text-muted-foreground">
                              Status changed from <Badge variant="outline">{log.oldStatus}</Badge> to{' '}
                              <Badge variant="outline">{log.newStatus}</Badge>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Changed by {log.changedBy}
                            </p>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <p>{new Date(log.timestamp).toLocaleDateString()}</p>
                            <p>{new Date(log.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No logs available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      
      case 'reports':
        // Only allow admins to access reports
        if (!isAdmin) {
          return (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
              </CardContent>
            </Card>
          );
        }
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Reports & Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Stock Cars</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stockCars?.length || 0}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Available: <span className="text-light-green font-medium">{availableCounts.stock}</span> | 
                      Booked: <span className="text-yellow font-medium">{bookedCounts.stock}</span>
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Incoming Cars</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{incomingCars?.length || 0}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Available: <span className="text-light-green font-medium">{availableCounts.incoming}</span> | 
                      Booked: <span className="text-yellow font-medium">{bookedCounts.incoming}</span>
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">KSA Cars</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{ksaCars?.length || 0}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Available: <span className="text-light-green font-medium">{availableCounts.ksa}</span> | 
                      Booked: <span className="text-yellow font-medium">{bookedCounts.ksa}</span>
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="p-6 border rounded-lg bg-muted/20">
                  <h3 className="font-semibold mb-4">All Cars Export</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Export complete inventory data to CSV or JSON format
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => {
                        const allCars = [...(stockCars || []), ...(incomingCars || []), ...(ksaCars || [])];
                        const csvContent = generateCSV(allCars);
                        downloadFile(csvContent, 'inventory-all-cars.csv', 'text/csv');
                      }}
                    >
                      Export All to CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const allCars = [...(stockCars || []), ...(incomingCars || []), ...(ksaCars || [])];
                        const jsonContent = JSON.stringify(allCars, null, 2);
                        downloadFile(jsonContent, 'inventory-all-cars.json', 'application/json');
                      }}
                    >
                      Export All to JSON
                    </Button>
                  </div>
                </div>

                <div className="p-6 border rounded-lg bg-muted/20">
                  <h3 className="font-semibold mb-4">Status-Based Reports</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Export cars by specific status (Available, Booked, etc.)
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      variant="default" 
                      size="sm"
                      className="bg-light-green hover:bg-light-green/90"
                      onClick={() => {
                        const allCars = [...(stockCars || []), ...(incomingCars || []), ...(ksaCars || [])];
                        const availableCars = getAvailableCars(allCars);
                        const csvContent = generateCSV(availableCars);
                        downloadFile(csvContent, 'inventory-available-cars.csv', 'text/csv');
                      }}
                    >
                      Available Cars CSV
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      className="bg-yellow hover:bg-yellow/90"
                      onClick={() => {
                        const allCars = [...(stockCars || []), ...(incomingCars || []), ...(ksaCars || [])];
                        const bookedCars = getBookedCars(allCars);
                        const csvContent = generateCSV(bookedCars);
                        downloadFile(csvContent, 'inventory-booked-cars.csv', 'text/csv');
                      }}
                    >
                      Booked Cars CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const allCars = [...(stockCars || []), ...(incomingCars || []), ...(ksaCars || [])];
                        const availableCars = getAvailableCars(allCars);
                        const jsonContent = JSON.stringify(availableCars, null, 2);
                        downloadFile(jsonContent, 'inventory-available-cars.json', 'application/json');
                      }}
                    >
                      Available JSON
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const allCars = [...(stockCars || []), ...(incomingCars || []), ...(ksaCars || [])];
                        const bookedCars = getBookedCars(allCars);
                        const jsonContent = JSON.stringify(bookedCars, null, 2);
                        downloadFile(jsonContent, 'inventory-booked-cars.json', 'application/json');
                      }}
                    >
                      Booked JSON
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* SP Tracker Section */}
              <div className="mt-8">
                <SPTracker cars={[...(stockCars || []), ...(incomingCars || []), ...(ksaCars || [])]} />
              </div>
            </CardContent>
          </Card>
        );
      
      case 'specs-upload':
        return <SpecsUpload />;
      
      default:
        return null;
    }
  };

  // Show authentication setup if not authenticated or no spreadsheet ID
  if (!isAuthenticated || !spreadsheetId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4 sm:p-6">
          <div className="w-full max-w-md mx-auto">
            <GoogleAuthButton />
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm sm:text-base text-muted-foreground">Loading car data from Google Sheets...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4 sm:p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive text-center">Error Loading Data</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'Failed to load data from Google Sheets'}
              </p>
              <Button onClick={() => window.location.reload()} className="w-full">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex h-[calc(100vh-80px)]">
        {/* Desktop Navigation */}
        <div className="hidden lg:block">
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        
        <main className="flex-1 flex flex-col min-w-0">
          {/* Mobile Navigation */}
          <div className="lg:hidden border-b border-border bg-background">
            <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
          
          {/* Content area with improved mobile margins */}
          <div className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 max-w-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;