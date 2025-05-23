import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Printer,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Lock,
  CheckCircle,
  AlertTriangle,
  X,
  ClipboardCheck,
  Clock,
  User,
  Building,
  GraduationCap,
  ContactRound,
} from "lucide-react";
import DashboardLayout from "@/components/globals/layouts/dashboard-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


const MahasiswaKerjaPraktekDailyReportIsiAgendaPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [showCompletionNotification, setShowCompletionNotification] =
    useState(false);
  const [showAbsensiNotification, setShowAbsensiNotification] = useState(false);
  const [absensiNotificationType, setAbsensiNotificationType] =
    useState("success");
  const [absensiNotificationMessage, setAbsensiNotificationMessage] =
    useState("");
  // Define types for agenda entries
  interface AgendaEntry {
    hari_kerja: string;
    tanggal: string;
    status: string;
  }

  interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    hasEntry: boolean;
    entry: AgendaEntry | null;
    isInternshipPeriod: boolean; // Added for tracking KP period
  }

  const [agendaEntries, setAgendaEntries] = useState<AgendaEntry[]>([]);
  // currentPage is used in handleAttendanceClick
  const [, setCurrentPage] = useState(0);
  const [lastAbsensiDate, setLastAbsensiDate] = useState<Date | null>(null);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  // Internship period dates - using current year to avoid date calculation issues
  const currentYear = new Date().getFullYear();
  const internshipStartDate = new Date(`${currentYear}-04-15`);
  const internshipEndDate = new Date(`${currentYear}-05-05`);

  // If current date is after end date for this year, use next year's dates
  if (new Date() > internshipEndDate) {
    internshipStartDate.setFullYear(currentYear + 1);
    internshipEndDate.setFullYear(currentYear + 1);
  }

  // Mahasiswa biodata
  const biodataMahasiswa = {
    nama: "Ahmad Kurniawan",
    nim: "1225011514",
    semester: "6",
    status: "Baru",
    instansi: "UIN SUSKA RIAU",
    dosenPembimbing: "-",
    PembimbingInstansi: "-",
  };

  useEffect(() => {
    const hasShownNotificationThisSession = sessionStorage.getItem(
      "kpNotificationShown"
    );

    const hasShownCompletionNotificationThisSession = sessionStorage.getItem(
      "kpCompletionNotificationShown"
    );

    // Load stored agenda entries from localStorage
    const storedEntries = localStorage.getItem("agendaEntries");
    if (storedEntries) {
      try {
        const parsedEntries = JSON.parse(storedEntries);
        setAgendaEntries(parsedEntries);
      } catch (error) {
        console.error("Error parsing stored agenda entries:", error);
        // Reset to empty array if there's an error
        localStorage.removeItem("agendaEntries");
      }
    }

    // Load last absensi date
    const storedLastAbsensiDate = localStorage.getItem("lastAbsensiDate");
    if (storedLastAbsensiDate) {
      try {
        setLastAbsensiDate(new Date(storedLastAbsensiDate));
      } catch (error) {
        console.error("Error parsing last absensi date:", error);
        localStorage.removeItem("lastAbsensiDate");
      }
    }

    // Simulate loading time
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);

      // Calculate internship progress first to use it for notification logic
      const internshipProgress = calculateInternshipProgress();

      // Only show warning notification if not completed and not shown before
      if (!internshipProgress.isCompleted && !hasShownNotificationThisSession) {
        const warningTimer = setTimeout(() => {
          setShowNotification(true);
          sessionStorage.setItem("kpNotificationShown", "true");
        }, 500);

        const hideWarningTimer = setTimeout(() => {
          setShowNotification(false);
        }, 10000);

        return () => {
          clearTimeout(warningTimer);
          clearTimeout(hideWarningTimer);
        };
      }

      // Show completion notification if completed and not shown before
      if (
        internshipProgress.isCompleted &&
        !hasShownCompletionNotificationThisSession
      ) {
        const completionTimer = setTimeout(() => {
          setShowCompletionNotification(true);
          sessionStorage.setItem("kpCompletionNotificationShown", "true");
        }, 1000);

        const hideCompletionTimer = setTimeout(() => {
          setShowCompletionNotification(false);
        }, 15000);

        return () => {
          clearTimeout(completionTimer);
          clearTimeout(hideCompletionTimer);
        };
      }
    }, 100);

    return () => clearTimeout(loadingTimer);
  }, []);

  // Calendar generation effect
  useEffect(() => {
    const days = generateCalendarDays(currentMonth);
    setCalendarDays(days);
  }, [currentMonth, agendaEntries]);

  // Function to check if a date is within the internship period
  const isDateInInternshipPeriod = (date: Date): boolean => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startOnly = new Date(internshipStartDate.getFullYear(), internshipStartDate.getMonth(), internshipStartDate.getDate());
    const endOnly = new Date(internshipEndDate.getFullYear(), internshipEndDate.getMonth(), internshipEndDate.getDate());
    
    return dateOnly >= startOnly && dateOnly <= endOnly;
  };

  // Function to get random status with only "Disetujui" and "Direvisi" options
  const getRandomStatus = () => {
    const statuses = ["Disetujui", "Menunggu"];
    const randomIndex = Math.floor(Math.random() * statuses.length);
    return statuses[randomIndex];
  };

  // Calculate total internship days and current progress
  const calculateInternshipProgress = () => {
    const today = new Date();
    const totalDays = Math.ceil(
      (internshipEndDate.getTime() - internshipStartDate.getTime()) /
        (1000 * 3600 * 24)
    );
    const elapsedDays = Math.ceil(
      (today.getTime() - internshipStartDate.getTime()) / (1000 * 3600 * 24)
    );
    const progressPercentage = Math.min(
      Math.max((elapsedDays / totalDays) * 100, 0),
      100
    );

    return {
      totalDays,
      elapsedDays,
      progressPercentage,
      daysRemaining: totalDays - elapsedDays,
      isCompleted: progressPercentage >= 100,
    };
  };

  const formatDate = (date = new Date()) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Helper functions for the calendar
  const generateCalendarDays = (date : Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    // First day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    // Last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Get the day of week of the first day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const firstDayWeekday = firstDayOfMonth.getDay();

    // Calculate how many days we need to show from the previous month
    const daysFromPrevMonth = firstDayWeekday;

    // Generate days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays = Array.from({ length: daysFromPrevMonth }, (_, i) => {
      const date = new Date(year, month - 1, prevMonthLastDay - daysFromPrevMonth + i + 1);
      return {
        date: date,
        isCurrentMonth: false,
        hasEntry: false,
        entry: null,
        isInternshipPeriod: isDateInInternshipPeriod(date)
      };
    });

    // Generate days for current month
    const currentMonthDays = Array.from(
      { length: lastDayOfMonth.getDate() },
      (_, i) => {
        const date = new Date(year, month, i + 1);
        const dateStr = formatDate(date);

        // Check if this day has an entry
        const entry = agendaEntries.find(entry =>
          entry.tanggal === dateStr
        );

        return {
          date: date,
          isCurrentMonth: true,
          hasEntry: !!entry,
          entry: entry || null,
          isInternshipPeriod: isDateInInternshipPeriod(date)
        };
      }
    );

    // Calculate how many days we need to show from the next month
    const totalDaysShown = 42; // 6 rows of 7 days
    const daysFromNextMonth = totalDaysShown - prevMonthDays.length - currentMonthDays.length;

    // Generate days from next month
    const nextMonthDays = Array.from({ length: daysFromNextMonth }, (_, i) => {
      const date = new Date(year, month + 1, i + 1);
      return {
        date: date,
        isCurrentMonth: false,
        hasEntry: false,
        entry: null,
        isInternshipPeriod: isDateInInternshipPeriod(date)
      };
    });

    // Combine all days
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric"
    });
  };

  const handlePrevMonth = (): void => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = (): void => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (day: CalendarDay): void => {
    if (day.hasEntry && day.entry) {
      navigate(`/mahasiswa/kerja-praktik/daily-report/detail?tanggal=${day.entry.tanggal}`);
    }
  };

  // Check if user already filled absensi today
  const isAbsensiAllowed = () => {
    if (!lastAbsensiDate) return true;

    const today = new Date();
    const lastDate = new Date(lastAbsensiDate);

    return (
      today.getDate() !== lastDate.getDate() ||
      today.getMonth() !== lastDate.getMonth() ||
      today.getFullYear() !== lastDate.getFullYear()
    );
  };

  const navigate = useNavigate();

  const showNotificationWithType = (type: string, message: string): void => {
    setAbsensiNotificationType(type);
    setAbsensiNotificationMessage(message);
    setShowAbsensiNotification(true);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowAbsensiNotification(false);
    }, 5000);
  };

  // Function to handle print button click
  const handlePrintClick = () => {
    if (internshipProgress.isCompleted) {
      // Do print action
      console.log("Mencetak laporan...");
      showNotificationWithType(
        "success",
        "Laporan sedang dicetak, mohon tunggu sebentar..."
      );
    } else {
      // Show notification if report is not complete
      showNotificationWithType(
        "error",
        "Laporan belum bisa dicetak. Selesaikan periode KP terlebih dahulu."
      );
    }
  };

  // Function to handle attendance button click
  const handleAttendanceClick = () => {
    // Check if absensi is allowed today
    if (!isAbsensiAllowed()) {
      showNotificationWithType(
        "warning",
        "Anda sudah mengisi absensi hari ini. Silakan coba lagi besok."
      );
      return;
    }

    // Add a new entry to the agenda
    const today = new Date();
    const currentDayNumber = agendaEntries.length + 1;
    const formattedDate = formatDate(today);
    const randomStatus = getRandomStatus();

    const newEntry = {
      hari_kerja: currentDayNumber.toString(),
      tanggal: formattedDate,
      status: randomStatus,
    };

    const updatedEntries = [...agendaEntries, newEntry];
    setAgendaEntries(updatedEntries);

    // Store the updated entries in localStorage
    localStorage.setItem("agendaEntries", JSON.stringify(updatedEntries));

    // Update and store last absensi date
    setLastAbsensiDate(today);
    localStorage.setItem("lastAbsensiDate", today.toString());

    // Always show the page containing the first entry
    setCurrentPage(0);

    showNotificationWithType(
      "success",
      `Berhasil mengisi absensi untuk hari ke-${currentDayNumber}. Silakan lengkapi detail agenda kerja hari ini.`
    );
  };

  // Function to handle closing the notification manually
  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  // Function to handle closing the completion notification manually
  const handleCloseCompletionNotification = () => {
    setShowCompletionNotification(false);
  };

  // Function to handle closing the absensi notification manually
  const handleCloseAbsensiNotification = () => {
    setShowAbsensiNotification(false);
  };

  // This function is not used in the current implementation but kept for future use
  // const getStatusColor = (status: string): string => {
  //   switch (status) {
  //     case "Disetujui":
  //       return "bg-green-100 text-green-800";
  //     case "Direvisi":
  //       return "bg-amber-100 text-amber-800";
  //     default:
  //       return "bg-gray-100 text-gray-800";
  //   }
  // };

  const getstatusmahasiswa = (status: string): string => {
    switch (status) {
      case "Baru":
        return "bg-green-500";
      case "Lanjut":
        return "bg-amber-500";
      case "Gagal":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get notification styles
  const getNotificationStyles = (type: string): {
    border: string;
    text: string;
    icon: JSX.Element;
    buttonClass: string;
    timerColor: string;
  } => {
    switch (type) {
      case "success":
        return {
          border: "border-l-4 border-green-500",
          text: "text-green-700",
          icon: (
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          ),
          buttonClass: "text-green-500 hover:text-green-700",
          timerColor: "bg-green-500",
        };
      case "warning":
        return {
          border: "border-l-4 border-amber-500",
          text: "text-amber-700",
          icon: (
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          ),
          buttonClass: "text-amber-500 hover:text-amber-700",
          timerColor: "bg-amber-500",
        };
      case "error":
        return {
          border: "border-l-4 border-red-500",
          text: "text-red-700",
          icon: <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />,
          buttonClass: "text-red-500 hover:text-red-700",
          timerColor: "bg-red-500",
        };
      default:
        return {
          border: "border-l-4 border-blue-500",
          text: "text-blue-700",
          icon: (
            <Clock className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          ),
          buttonClass: "text-blue-500 hover:text-blue-700",
          timerColor: "bg-blue-500",
        };
    }
  };

  const internshipProgress = calculateInternshipProgress();

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
          {isLoading ? (
            <Skeleton className="h-9 w-64" />
          ) : (
            <CardTitle className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-0">
              Daily Report Kerja Praktik
            </CardTitle>
          )}
        </CardHeader>
        <CardContent>
          {/* Warning Notification for incomplete progress - Only show if not completed */}
          {!isLoading && showNotification && !internshipProgress.isCompleted && (
            <div
              className="fixed top-4 right-4 z-50 max-w-md transform transition-all duration-500 ease-in-out"
              style={{
                animation: "slideIn 0.5s ease-out",
                opacity: showNotification ? 1 : 0,
                transform: showNotification
                  ? "translateX(0)"
                  : "translateX(100%)",
              }}
            >
              <div className="bg-white dark:bg-gray-800 border-l-4 border-amber-500 text-amber-700 p-4 rounded-md shadow-lg flex items-start justify-between relative">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sm">Pengingat Penting</h3>
                    <p className="text-sm">
                      Anda harus menyelesaikan 100% periode KP untuk dapat
                      mencetak laporan.
                      {internshipProgress.daysRemaining > 0 && (
                        <span className="block mt-1 font-medium">
                          Masih tersisa {internshipProgress.daysRemaining}{" "}
                          hari lagi.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseNotification}
                  className="text-amber-500 hover:text-amber-700 ml-2 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Timer countdown line */}
                <div className="absolute bottom-0 left-0 h-1 bg-amber-500 w-full rounded-b-md" style={{ animation: "countdown 10s linear forwards" }}></div>
              </div>
            </div>
          )}

          {/* Success Notification for 100% completion */}
          {!isLoading && showCompletionNotification && internshipProgress.isCompleted && (
            <div
              className="fixed top-4 right-4 z-50 max-w-md transform transition-all duration-500 ease-in-out"
              style={{
                animation: "slideIn 0.5s ease-out",
                opacity: showCompletionNotification ? 1 : 0,
                transform: showCompletionNotification
                  ? "translateX(0)"
                  : "translateX(100%)",
              }}
            >
              <div className="bg-white dark:bg-gray-800 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-lg flex items-start justify-between relative">
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sm">Selamat!</h3>
                    <p className="text-sm">
                      Anda telah menyelesaikan 100% periode Kerja Praktik.
                      <span className="block mt-1 font-medium">
                        Sekarang Anda dapat mencetak laporan KP.
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseCompletionNotification}
                  className="text-green-500 hover:text-green-700 ml-2 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Timer countdown line */}
                <div className="absolute bottom-0 left-0 h-1 bg-green-500 w-full rounded-b-md" style={{ animation: "countdown 15s linear forwards" }}></div>
              </div>
            </div>
          )}

          {/* Absensi Notification - Dynamic based on type */}
          {!isLoading && showAbsensiNotification && (
            <div
              className="fixed top-4 right-4 z-50 max-w-md transform transition-all duration-500 ease-in-out"
              style={{
                animation: "slideIn 0.5s ease-out",
                opacity: showAbsensiNotification ? 1 : 0,
                transform: showAbsensiNotification
                  ? "translateX(0)"
                  : "translateX(100%)",
              }}
            >
              <div
                className={`bg-white dark:bg-gray-800/30 ${
                  getNotificationStyles(absensiNotificationType).border
                } ${
                  getNotificationStyles(absensiNotificationType).text
                } p-4 rounded-md shadow-lg flex items-start justify-between relative`}
              >
                <div className="flex gap-3">
                  {getNotificationStyles(absensiNotificationType).icon}
                  <div>
                    <h3 className="font-bold text-sm">
                      {absensiNotificationType === "success"
                        ? "Berhasil!"
                        : absensiNotificationType === "warning"
                        ? "Perhatian!"
                        : absensiNotificationType === "error"
                        ? "Gagal!"
                        : "Informasi"}
                    </h3>
                    <p className="text-sm">{absensiNotificationMessage}</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseAbsensiNotification}
                  className={`${
                    getNotificationStyles(absensiNotificationType).buttonClass
                  } ml-2 flex-shrink-0`}
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Timer countdown line */}
                <div
                  className={`absolute bottom-0 left-0 h-1 ${
                    getNotificationStyles(absensiNotificationType).timerColor
                  } w-full rounded-b-md`}
                  style={{ animation: "countdown 5s linear forwards" }}
                ></div>
              </div>
            </div>
          )}

          {/* Biodata Section */}
          <div className="mb-6">
            {isLoading ? (
              <div className="bg-white dark:bg-gray-800/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-md">
                {/* Header Skeleton */}
                <div className="bg-gradient-to-br from-purple-600/40 to-indigo-700/40 p-4 rounded-t-lg border-b border-gray-100 dark:border-gray-700 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-40 mb-2" />
                      <div className="flex items-center">
                        <Skeleton className="h-4 w-20 mr-2" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>

                {/* Info Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Skeleton className="h-24 w-full rounded-lg" />
                  <Skeleton className="h-24 w-full rounded-lg" />
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800/40 dark:to-gray-800/20  rounded-lg border border-gray-100 dark:border-gray-700 shadow-md overflow-hidden">


              {/* Header Section with Avatar */}
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-gray-800 rounded-full h-12 w-12 flex items-center justify-center shadow-inner border border-primary/20">
                      <User className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-50 dark:text-gray-100">
                        {biodataMahasiswa.nama}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <span className="bg-white text-gray-600 dark:text-gray-300 dark:bg-gray-800 px-2 py-0.5 rounded-md border dark:border-gray-700 text-xs font-medium mr-2">
                          Semester {biodataMahasiswa.semester}
                        </span>
                        <span className="flex text-white items-center">
                          <span
                            className={`inline-block animate-pulse w-3 h-3 rounded-full mr-1.5 ${getstatusmahasiswa(
                              biodataMahasiswa.status
                            )}`}
                          ></span>
                          {biodataMahasiswa.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {biodataMahasiswa.nim}
                    </span>
                  </div>
                </div>

                {/* Info Cards */}
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* NIM Card */}
                    <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-bl-full -translate-y-6 translate-x-6 group-hover:translate-y-0 group-hover:translate-x-0 transition-transform duration-300"></div>

                      <div className="flex items-center gap-3 relative z-10">
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2.5">
                          <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Instansi
                          </p>
                          <p className="text-base font-bold text-gray-800 dark:text-gray-200">
                            {biodataMahasiswa.instansi}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Instansi Card */}
                    <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-bl-full -translate-y-6 translate-x-6 group-hover:translate-y-0 group-hover:translate-x-0 transition-transform duration-300"></div>

                      <div className="flex items-center gap-3 relative z-10">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-lg p-2.5">
                          <ContactRound className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Pembimbing Instansi
                          </p>
                          <p className="text-base font-bold text-gray-800 dark:text-gray-200">
                            {biodataMahasiswa.PembimbingInstansi}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dosen Card */}
                    <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-bl-full -translate-y-6 translate-x-6 group-hover:translate-y-0 group-hover:translate-x-0 transition-transform duration-300"></div>

                      <div className="flex items-center gap-3 relative z-10">
                        <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-2.5">
                          <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Dosen Pembimbing
                          </p>
                          <p className="text-base font-bold text-gray-800 dark:text-gray-200">
                            {biodataMahasiswa.dosenPembimbing}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Buttons Section (replacing progress bar) */}
          <div className="mb-6 sm:mb-8">
            {isLoading ? (
              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <Skeleton className="h-5 w-64 rounded" />
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Skeleton className="h-10 w-24 rounded" />
                    <Skeleton className="h-10 w-32 rounded" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Periode KP: </span>
                    <span className="text-primary">
                      {formatDate(internshipStartDate)}
                    </span>
                    <span> - </span>
                    <span className="text-primary">
                      {formatDate(internshipEndDate)}
                    </span>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    {/* Attendance Button */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            className={`w-full sm:w-auto flex items-center gap-2 ${
                              isAbsensiAllowed()
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                : "bg-gray-400 text-white cursor-not-allowed"
                            }`}
                            onClick={handleAttendanceClick}
                            disabled={!isAbsensiAllowed()}
                          >
                            <ClipboardCheck className="h-4 w-4" />
                            Absensi
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isAbsensiAllowed()
                            ? "Klik untuk mengisi absensi harian"
                            : "Anda sudah mengisi absensi hari ini"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/*Print Botton Kondisi */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="w-full sm:w-auto"
                            style={{
                              cursor: !internshipProgress.isCompleted
                                ? "not-allowed"
                                : "pointer",
                            }}
                          >
                            <Button
                              variant={
                                internshipProgress.isCompleted
                                  ? "secondary"
                                  : "outline"
                              }
                              className="w-full sm:w-auto flex items-center gap-2"
                              style={{
                                cursor: !internshipProgress.isCompleted
                                  ? "not-allowed"
                                  : "pointer",
                              }}
                              disabled={!internshipProgress.isCompleted}
                              onClick={handlePrintClick}
                            >
                              {internshipProgress.isCompleted ? (
                                <>
                                  <Printer className="h-4 w-4 text-green-500" />
                                  Cetak Daily report
                                </>
                              ) : (
                                <>
                                  <Lock className="h-4 w-4" />
                                  Cetak Daily Report
                                </>
                              )}
                            </Button>
                          </div>
                        </TooltipTrigger>
                        {!internshipProgress.isCompleted && (
                          <TooltipContent>
                            <p>
                              Anda harus menyelesaikan 100% periode KP untuk
                              mencetak laporan
                            </p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Calendar Section - replacing the table */}
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-4">
                <Skeleton className="h-8 w-48 mb-4 mx-auto" />
                <div className="grid grid-cols-7 gap-2">
                  {Array(7).fill(0).map((_, i) => (
                    <Skeleton key={`header-${i}`} className="h-8 rounded-md" />
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 mt-2">
                  {Array(42).fill(0).map((_, i) => (
                    <Skeleton key={`day-${i}`} className="h-24 rounded-md" />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Calendar Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevMonth}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>

                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {formatMonthYear(currentMonth)}
                  </h3>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextMonth}
                    className="flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 bg-gray-100 dark:bg-gray-700/30">
                  {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((day, index) => (
                    <div
                      key={day}
                      className={`py-2 text-center text-sm font-medium ${
                        index === 0 || index === 6
                          ? "text-red-500 dark:text-red-400"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 bg-white dark:bg-gray-800/20">
                  {calendarDays.map((day, index) => (
                    <div
                      key={index}
                      className={`
                        min-h-24 p-1 border-t border-l border-gray-100 dark:border-gray-700
                        ${!day.isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800/40 opacity-40' : ''}
                        ${day.date.getDay() === 0 || day.date.getDay() === 6 ? 'bg-gray-50 dark:bg-gray-800/30' : ''}
                        ${day.hasEntry ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10' : ''}
                        ${day.isInternshipPeriod && !day.hasEntry ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/20' : ''}
                        ${index % 7 === 0 ? 'border-l-0' : ''}
                        ${index < 7 ? 'border-t-0' : ''}
                        relative
                      `}
                      onClick={() => day.hasEntry && handleDateClick(day)}
                    >
                      {/* Date Number */}
                      <div className={`
                        absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full
                        ${day.hasEntry && day.entry
                          ? day.entry.status === 'Disetujui'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                          : day.isInternshipPeriod
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-300 dark:border-red-700'
                          : 'text-gray-700 dark:text-gray-400'
                        }
                        ${!day.isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : ''}
                        text-sm font-medium
                      `}>
                        {day.date.getDate()}
                      </div>

                      {/* Entry Content */}
                      {day.hasEntry && day.entry && (
                        <div className="mt-6 p-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={`
                                  rounded-md p-2 text-xs
                                  ${day.entry.status === 'Disetujui'
                                    ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20'
                                    : 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20'
                                  }
                                `}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                      Hari Ke-{day.entry.hari_kerja}
                                    </span>
                                    {day.entry.status === 'Disetujui' ? (
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                                    )}
                                  </div>
                                  <div className={`
                                    text-xs px-1.5 py-0.5 rounded-sm w-fit mt-1
                                    ${day.entry.status === 'Disetujui'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                    }
                                  `}>
                                    {day.entry.status}
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Klik untuk melihat detail</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}

                      {/* Internship Period Indicator for dates without entries */}
                      {day.isInternshipPeriod && !day.hasEntry && (
                        <div className="mt-6 p-1">
                          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-md p-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-red-700 dark:text-red-300 text-xs">
                                Hari KP
                              </span>
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                            </div>
                            <div className="text-xs px-1.5 py-0.5 rounded-sm w-fit mt-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                              Belum Absen
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Today indicator */}
                      {day.date.toDateString() === new Date().toDateString() && (
                        <div className="absolute bottom-1 left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/50 flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Disetujui</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span>Menunggu</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Belum Absen</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Hari Ini</span>
                  </div>

                  {agendaEntries.length === 0 && (
                    <div className="ml-auto text-sm text-gray-500">
                      <Calendar className="h-4 w-4 inline-block mr-1 opacity-50" />
                      <span>Belum ada entri agenda. Klik tombol "Absensi" untuk menambahkan.</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <style type="text/css">{`
            @keyframes slideIn {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0%);
                opacity: 1;
              }
            }

            @keyframes countdown {
              from {
                width: 100%;
                right: 0;
                left: auto;
              }
              to {
                width: 0%;
                right: 0;
                left: auto;
              }
            }

            .status-indicator {
              border-radius: 50%;
              display: inline-block;
              height: 10px;
              width: 10px;
              margin-right: 6px;
            }
          `}</style>
        </CardContent>
      </div>
    </DashboardLayout>
  );
};

export default MahasiswaKerjaPraktekDailyReportIsiAgendaPage;