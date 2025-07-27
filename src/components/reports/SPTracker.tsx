import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Car } from "@/types/car";
import { User } from "lucide-react";

interface SPTrackerProps {
  cars: Car[];
}

interface SPStats {
  sp: string;
  booked: number;
  sold: number;
  total: number;
}

interface SPStatsWithSets {
  sp: string;
  booked: number;
  sold: number;
  total: number;
  bookedDeals: Set<string>;
  soldDeals: Set<string>;
}

export const SPTracker = ({ cars }: SPTrackerProps) => {
  // Group cars by SP initials and count unique deals
  const spStats = cars.reduce((acc: Record<string, SPStatsWithSets>, car) => {
    // Use SP initials from the highlighted column
    const sp = car.sp?.trim().toUpperCase() || 'UNASSIGNED';
    const deal = car.deal?.trim();
    
    if (!acc[sp]) {
      acc[sp] = { 
        sp, 
        booked: 0, 
        sold: 0, 
        total: 0,
        bookedDeals: new Set<string>(),
        soldDeals: new Set<string>()
      };
    }
    
    // Handle various status spellings and cases
    const status = car.status?.toLowerCase().trim();
    
    // Only count deals that have a valid deal ID and are not empty
    if (deal && deal !== '' && deal !== 'N/A' && deal !== 'n/a' && deal !== 'null') {
      // Count as BOOKED: booked, received advance, partial payment
      if (status === 'booked' || 
          status === 'received advance' || 
          status === 'partial payment' ||
          status === 'recived advance' || // handle typos
          status === 'recieved advance') {
        acc[sp].bookedDeals.add(deal);
      } 
      // Count as SOLD: everything else except available/unreceived
      else if (status !== 'available' && 
               status !== 'unreceived' && 
               status !== '') {
        acc[sp].soldDeals.add(deal);
      }
    }
    
    return acc;
  }, {});

  // Convert sets to counts and calculate totals
  const processedStats = Object.values(spStats).map(stat => ({
    sp: stat.sp,
    booked: stat.bookedDeals.size,
    sold: stat.soldDeals.size,
    total: stat.bookedDeals.size + stat.soldDeals.size
  }));

  // Filter and sort by total (highest first)
  const sortedStats = processedStats
    .filter(stat => stat.total > 0) // Only show SPs with booked/sold deals
    .sort((a, b) => b.total - a.total);

  const totalBooked = sortedStats.reduce((sum, stat) => sum + stat.booked, 0);
  const totalSold = sortedStats.reduce((sum, stat) => sum + stat.sold, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Sales Person Performance Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalBooked}</div>
            <div className="text-sm text-muted-foreground">Total Booked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalSold}</div>
            <div className="text-sm text-muted-foreground">Total Sold</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalBooked + totalSold}</div>
            <div className="text-sm text-muted-foreground">Total Deals</div>
          </div>
        </div>

        {sortedStats.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No booked or sold cars found
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sales Person</TableHead>
                <TableHead className="text-center">Booked</TableHead>
                <TableHead className="text-center">Sold</TableHead>
                <TableHead className="text-center">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStats.map((stat) => (
                <TableRow key={stat.sp}>
                  <TableCell className="font-medium">{stat.sp}</TableCell>
                  <TableCell className="text-center">
                    {stat.booked > 0 && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {stat.booked}
                      </Badge>
                    )}
                    {stat.booked === 0 && <span className="text-muted-foreground">0</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {stat.sold > 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {stat.sold}
                      </Badge>
                    )}
                    {stat.sold === 0 && <span className="text-muted-foreground">0</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-bold">
                      {stat.total}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};