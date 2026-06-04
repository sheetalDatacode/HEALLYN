import { motion } from 'framer-motion'
import { useState } from 'react'

const LaboratoryBenefitsGrid = ({ items = [] }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
    >
      {items.map((benefit, index) => {
        const IconComponent = benefit.icon
        const isHovered = hoveredIndex === index

        return (
          <motion.div
            key={benefit.title}
            variants={itemVariants}
            className="relative group"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Animated Card */}
            <motion.div
              className="relative h-full bg-white rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-amber-100"
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Gradient Background on Hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                initial={false}
                animate={{ opacity: isHovered ? 1 : 0 }}
              />

              {/* Animated Border Glow */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-amber-200 opacity-0"
                initial={false}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />

              {/* Shimmer Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-2xl"
                initial={false}
                animate={{ x: isHovered ? '100%' : '-100%' }}
                transition={{ duration: 1, ease: 'easeInOut' }}
              />

              <div className="relative z-10">
                {/* Icon Container */}
                <motion.div
                  className="mb-5 inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 shadow-md group-hover:shadow-xl transition-all duration-500"
                  animate={{
                    scale: isHovered ? 1.1 : 1,
                    rotate: isHovered ? [0, -5, 5, -5, 0] : 0,
                  }}
                  transition={{
                    scale: { duration: 0.3 },
                    rotate: { duration: 0.5 },
                  }}
                >
                  <IconComponent className="text-3xl text-amber-600 drop-shadow-sm" />
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-amber-700 transition-colors duration-300">
                  {benefit.title}
                </h3>
                <motion.p
                  className="text-slate-600 leading-relaxed"
                  animate={{
                    color: isHovered ? '#92400e' : '#475569',
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {benefit.description}
                </motion.p>

                {/* Decorative Accent */}
                <motion.div
                  className="mt-4 h-1 w-12 bg-gradient-to-r from-amber-400 to-amber-300 rounded-full"
                  animate={{
                    width: isHovered ? '100%' : '48px',
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Corner Decoration */}
              <motion.div
                className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-100/50 to-transparent rounded-bl-full opacity-0"
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

export default LaboratoryBenefitsGrid

