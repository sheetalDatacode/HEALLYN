import {
  IoLogoFacebook,
  IoLogoTwitter,
  IoLogoLinkedin,
  IoLogoInstagram,
  IoCallOutline,
  IoMailOutline,
} from 'react-icons/io5'
import healinnLogo from '../../assets/images/logo.png'

/**
 * MiniFooter — shared compact footer for Nurse and Patient modules.
 *
 * Props:
 *  - showLogo    {boolean}  Show the Heallyn logo (default true)
 *  - email       {string}   Support email (default "support@heallyn.com")
 *  - phone       {string}   Support phone (default "+1 (555) 123-4567")
 *  - darkBg      {boolean}  Use dark background like Patient footer (default false = white)
 */
const MiniFooter = ({
  showLogo = true,
  email = 'support@heallyn.com',
  phone = '+1 (555) 123-4567',
  darkBg = false,
}) => {
  const socialIcons = [IoLogoFacebook, IoLogoTwitter, IoLogoLinkedin, IoLogoInstagram]

  if (darkBg) {
    // Dark variant — Patient footer style
    return (
      <footer className="bg-[#0b3b5b] text-white pt-8 pb-6 w-full mt-auto">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold">Follow Us:</span>
              <div className="flex items-center gap-3">
                {socialIcons.map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    aria-label="Social media"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-white/80 font-medium">
              <div className="flex items-center gap-2">
                <IoCallOutline className="h-4 w-4 text-white/60" />
                <span>Support: {phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <IoMailOutline className="h-4 w-4 text-white/60" />
                <span>{email}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-8 mt-6 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <p>© {new Date().getFullYear()} Heallyn. All rights reserved.</p>
        </div>
      </footer>
    )
  }

  // Light variant — Nurse footer style
  return (
    <footer className="hidden lg:block bg-white border-t border-slate-100 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo and Copyright */}
          <div className="flex items-center gap-6">
            {showLogo && (
              <img
                src={healinnLogo}
                alt="Heallyn"
                className="h-6 w-auto object-contain opacity-80"
              />
            )}
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              © {new Date().getFullYear()} Heallyn. All rights reserved.
            </p>
          </div>

          {/* Support Info & Social */}
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">
                Support Services
              </p>
              <p className="text-[11px] font-bold text-slate-600">{email}</p>
            </div>

            <div className="flex items-center gap-3">
              {socialIcons.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-[#11496c] hover:text-white transition-all duration-300"
                  aria-label="Social media"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default MiniFooter
